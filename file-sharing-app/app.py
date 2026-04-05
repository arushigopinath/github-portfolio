import http.server
import socketserver
import socket
import os
import html
import mimetypes
from urllib.parse import unquote, urlparse, parse_qs, quote
from pathlib import Path
from io import BytesIO

PORT = 8000
SHARED_FOLDER = "shared_files"

os.makedirs(SHARED_FOLDER, exist_ok=True)


def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip


def format_file_size(size):
    for unit in ["B", "KB", "MB", "GB"]:
        if size < 1024:
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} TB"


def get_file_icon(filename):
    ext = Path(filename).suffix.lower()

    if ext in [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"]:
        return "🖼️"
    if ext in [".pdf"]:
        return "📄"
    if ext in [".txt", ".md", ".doc", ".docx"]:
        return "📝"
    if ext in [".zip", ".rar", ".7z", ".tar", ".gz"]:
        return "🗜️"
    if ext in [".mp4", ".mov", ".avi", ".mkv"]:
        return "🎞️"
    if ext in [".mp3", ".wav", ".ogg"]:
        return "🎵"
    if ext in [".py", ".js", ".html", ".css", ".cpp", ".java"]:
        return "💻"
    return "📁"


def sanitize_filename(filename):
    filename = os.path.basename(filename).strip()
    filename = filename.replace("\x00", "")
    return filename


def unique_file_path(folder, filename):
    base = Path(filename).stem
    ext = Path(filename).suffix
    candidate = os.path.join(folder, filename)

    counter = 1
    while os.path.exists(candidate):
        candidate = os.path.join(folder, f"{base} ({counter}){ext}")
        counter += 1

    return candidate


def safe_join_shared(filename):
    filename = sanitize_filename(filename)
    if not filename:
        return None

    full_path = os.path.abspath(os.path.join(SHARED_FOLDER, filename))
    shared_root = os.path.abspath(SHARED_FOLDER)

    if not full_path.startswith(shared_root):
        return None

    return full_path


class ThreadingTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True


class FileSharingHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        path = unquote(path.split("?", 1)[0])
        path = path.lstrip("/")
        return os.path.join(os.getcwd(), SHARED_FOLDER, path)

    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == "/delete":
            params = parse_qs(parsed.query)
            filename = params.get("file", [""])[0]
            file_path = safe_join_shared(filename)

            if file_path and os.path.isfile(file_path):
                try:
                    os.remove(file_path)
                except Exception:
                    pass

            self.send_response(303)
            self.send_header("Location", "/")
            self.end_headers()
            return

        return super().do_GET()

    def do_POST(self):
        if self.path != "/upload":
            self.send_error(404, "Route not found")
            return

        content_length = int(self.headers.get("Content-Length", 0))
        content_type = self.headers.get("Content-Type", "")

        if "multipart/form-data" not in content_type:
            self.send_error(400, "Invalid upload type")
            return

        if "boundary=" not in content_type:
            self.send_error(400, "Missing boundary")
            return

        boundary = content_type.split("boundary=")[-1].encode()
        body = self.rfile.read(content_length)
        parts = body.split(b"--" + boundary)

        for part in parts:
            if b"Content-Disposition" not in part:
                continue

            try:
                headers, file_data = part.split(b"\r\n\r\n", 1)
            except ValueError:
                continue

            header_str = headers.decode(errors="ignore")

            if "filename=" not in header_str:
                continue

            try:
                filename = header_str.split('filename="')[1].split('"')[0]
            except IndexError:
                continue

            filename = sanitize_filename(filename)

            if not filename:
                continue

            file_data = file_data.rstrip(b"\r\n")
            save_path = unique_file_path(SHARED_FOLDER, filename)

            try:
                with open(save_path, "wb") as f:
                    f.write(file_data)
            except Exception:
                continue

        self.send_response(303)
        self.send_header("Location", "/")
        self.end_headers()

    def list_directory(self, path):
        try:
            files = os.listdir(path)
        except OSError:
            self.send_error(404, "No permission to list directory")
            return None

        files.sort(key=lambda x: x.lower())
        file_cards = ""

        for name in files:
            full_path = os.path.join(path, name)
            is_dir = os.path.isdir(full_path)
            size = "-" if is_dir else format_file_size(os.path.getsize(full_path))
            icon = "📂" if is_dir else get_file_icon(name)

            safe_name = html.escape(name)
            safe_href = quote(name)
            delete_name = name.replace("\\", "\\\\").replace("'", "\\'")

            file_cards += f"""
            <div class="file-card">
                <div class="file-left">
                    <div class="file-icon">{icon}</div>
                    <div class="file-details">
                        <div class="file-name" title="{safe_name}">{safe_name}</div>
                        <div class="file-meta">{'Folder' if is_dir else size}</div>
                    </div>
                </div>

                <div class="file-actions">
                    <a class="file-action open-btn" href="/{safe_href}">Open</a>
                    <a class="file-action download-btn" href="/{safe_href}" download>Download</a>
                    <button class="delete-btn" onclick="deleteFile('{delete_name}')">Delete</button>
                </div>
            </div>
            """

        local_ip = get_local_ip()
        share_link = f"http://{local_ip}:{PORT}"

        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>LocalShare</title>
            <style>
                * {{
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                    font-family: Arial, sans-serif;
                }}

                body {{
                    background: linear-gradient(135deg, #eef2ff, #f8fafc);
                    color: #1e293b;
                    min-height: 100vh;
                    padding: 30px 16px;
                }}

                .container {{
                    max-width: 1050px;
                    margin: 0 auto;
                }}

                .hero {{
                    background: white;
                    border-radius: 22px;
                    padding: 28px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                    margin-bottom: 24px;
                }}

                .hero h1 {{
                    font-size: 2rem;
                    margin-bottom: 8px;
                }}

                .hero p {{
                    color: #475569;
                    margin-bottom: 16px;
                    line-height: 1.5;
                }}

                .share-row {{
                    display: flex;
                    gap: 10px;
                    align-items: stretch;
                    margin-bottom: 18px;
                    flex-wrap: wrap;
                }}

                .link-box {{
                    flex: 1;
                    min-width: 240px;
                    background: #f1f5f9;
                    border-radius: 12px;
                    padding: 12px;
                    word-break: break-all;
                    font-size: 0.95rem;
                    color: #0f172a;
                }}

                .copy-btn {{
                    background: #0f172a;
                    color: white;
                    border: none;
                    padding: 12px 16px;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 0.95rem;
                }}

                .copy-btn:hover {{
                    background: #1e293b;
                }}

                .upload-box {{
                    background: #f8fafc;
                    border: 2px dashed #94a3b8;
                    border-radius: 16px;
                    padding: 20px;
                }}

                .upload-box h2 {{
                    font-size: 1.1rem;
                    margin-bottom: 8px;
                }}

                .upload-box p {{
                    color: #64748b;
                    margin-bottom: 14px;
                    font-size: 0.95rem;
                }}

                .drop-zone {{
                    border: 2px dashed #94a3b8;
                    background: white;
                    border-radius: 14px;
                    padding: 28px 16px;
                    text-align: center;
                    margin-bottom: 14px;
                    transition: 0.2s ease;
                }}

                .drop-zone.dragover {{
                    border-color: #2563eb;
                    background: #eff6ff;
                }}

                .drop-zone strong {{
                    display: block;
                    font-size: 1rem;
                    margin-bottom: 6px;
                }}

                .drop-zone span {{
                    color: #64748b;
                    font-size: 0.92rem;
                }}

                .file-input {{
                    margin-top: 14px;
                }}

                input[type="file"] {{
                    display: block;
                    margin: 0 auto 12px auto;
                }}

                button {{
                    background: #2563eb;
                    color: white;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 0.95rem;
                }}

                button:hover {{
                    background: #1d4ed8;
                }}

                .section-header {{
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    margin: 20px 0 14px;
                    flex-wrap: wrap;
                }}

                .section-title {{
                    font-size: 1.2rem;
                    font-weight: bold;
                }}

                .search-box {{
                    padding: 10px 12px;
                    border-radius: 10px;
                    border: 1px solid #cbd5e1;
                    min-width: 240px;
                    font-size: 0.95rem;
                }}

                .files {{
                    display: grid;
                    gap: 14px;
                }}

                .file-card {{
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 16px;
                    background: white;
                    border-radius: 16px;
                    padding: 16px 18px;
                    box-shadow: 0 6px 18px rgba(0,0,0,0.06);
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                }}

                .file-card:hover {{
                    transform: translateY(-2px);
                    box-shadow: 0 10px 24px rgba(0,0,0,0.1);
                }}

                .file-left {{
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    min-width: 0;
                    flex: 1;
                }}

                .file-details {{
                    min-width: 0;
                }}

                .file-icon {{
                    font-size: 1.8rem;
                    flex-shrink: 0;
                }}

                .file-name {{
                    font-weight: bold;
                    margin-bottom: 4px;
                    word-break: break-word;
                }}

                .file-meta {{
                    font-size: 0.9rem;
                    color: #64748b;
                }}

                .file-actions {{
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    justify-content: flex-end;
                }}

                .file-action {{
                    text-decoration: none;
                    color: white;
                    padding: 8px 14px;
                    border-radius: 10px;
                    font-size: 0.9rem;
                    white-space: nowrap;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    cursor: pointer;
                }}

                .open-btn {{
                    background: #2563eb;
                }}

                .open-btn:hover {{
                    background: #1d4ed8;
                }}

                .download-btn {{
                    background: #0f766e;
                }}

                .download-btn:hover {{
                    background: #115e59;
                }}

                .delete-btn {{
                    background: #ef4444;
                    color: white;
                    border: none;
                    padding: 8px 14px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 0.9rem;
                }}

                .delete-btn:hover {{
                    background: #dc2626;
                }}

                .empty {{
                    background: white;
                    padding: 24px;
                    border-radius: 16px;
                    text-align: center;
                    color: #64748b;
                    box-shadow: 0 6px 18px rgba(0,0,0,0.06);
                }}

                .toast {{
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: #0f172a;
                    color: white;
                    padding: 12px 16px;
                    border-radius: 12px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.18);
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.25s ease;
                    z-index: 999;
                }}

                .toast.show {{
                    opacity: 1;
                }}

                @media (max-width: 700px) {{
                    .file-card {{
                        flex-direction: column;
                        align-items: flex-start;
                    }}

                    .file-actions {{
                        width: 100%;
                        justify-content: flex-start;
                    }}

                    .copy-btn {{
                        width: 100%;
                    }}

                    .search-box {{
                        width: 100%;
                    }}
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="hero">
                    <h1>LocalShare</h1>
                    <p>Simple file sharing across devices on the same Wi-Fi network. Upload, download, and manage files from one clean interface.</p>

                    <div class="share-row">
                        <div class="link-box" id="shareLink">{html.escape(share_link)}</div>
                        <button class="copy-btn" onclick="copyLink()">Copy Link</button>
                    </div>

                    <div class="upload-box">
                        <h2>Upload files</h2>
                        <p>Drag files into the area below or choose them manually.</p>

                        <form id="uploadForm" action="/upload" method="post" enctype="multipart/form-data">
                            <div class="drop-zone" id="dropZone">
                                <strong>Drag and drop files here</strong>
                                <span>or use the file picker below</span>
                                <div class="file-input">
                                    <input type="file" id="fileInput" name="file" multiple>
                                    <button type="submit">Upload</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                <div class="section-header">
                    <div class="section-title">Shared Files</div>
                    <input type="text" id="searchInput" class="search-box" placeholder="Search files...">
                </div>

                <div class="files" id="fileList">
                    {file_cards if file_cards else '<div class="empty">No files found in the shared folder.</div>'}
                </div>
            </div>

            <div class="toast" id="toast">Done</div>

            <script>
                function copyLink() {{
                    const link = document.getElementById("shareLink").innerText;
                    navigator.clipboard.writeText(link).then(() => {{
                        showToast("Link copied");
                    }}).catch(() => {{
                        showToast("Could not copy link");
                    }});
                }}

                function showToast(message) {{
                    const toast = document.getElementById("toast");
                    toast.innerText = message;
                    toast.classList.add("show");
                    setTimeout(() => {{
                        toast.classList.remove("show");
                    }}, 2000);
                }}

                function deleteFile(name) {{
                    if (confirm("Delete " + name + "?")) {{
                        window.location.href = "/delete?file=" + encodeURIComponent(name);
                    }}
                }}

                const dropZone = document.getElementById("dropZone");
                const fileInput = document.getElementById("fileInput");

                dropZone.addEventListener("dragover", (e) => {{
                    e.preventDefault();
                    dropZone.classList.add("dragover");
                }});

                dropZone.addEventListener("dragleave", () => {{
                    dropZone.classList.remove("dragover");
                }});

                dropZone.addEventListener("drop", (e) => {{
                    e.preventDefault();
                    dropZone.classList.remove("dragover");

                    const files = e.dataTransfer.files;
                    fileInput.files = files;
                    showToast(files.length + " file(s) ready to upload");
                }});

                document.getElementById("searchInput").addEventListener("input", function () {{
                    const term = this.value.toLowerCase();
                    const cards = document.querySelectorAll(".file-card");

                    cards.forEach(card => {{
                        const name = card.querySelector(".file-name").innerText.toLowerCase();
                        card.style.display = name.includes(term) ? "flex" : "none";
                    }});
                }});
            </script>
        </body>
        </html>
        """

        encoded = html_content.encode("utf-8", "surrogateescape")
        self.send_response(200)
        self.send_header("Content-type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()

        response = BytesIO()
        response.write(encoded)
        response.seek(0)
        return response

    def guess_type(self, path):
        return mimetypes.guess_type(path)[0] or "application/octet-stream"


if __name__ == "__main__":
    with ThreadingTCPServer(("", PORT), FileSharingHandler) as httpd:
        local_ip = get_local_ip()
        print(f"Serving folder: {os.path.abspath(SHARED_FOLDER)}")
        print(f"Local:   http://localhost:{PORT}")
        print(f"Network: http://{local_ip}:{PORT}")
        httpd.serve_forever()