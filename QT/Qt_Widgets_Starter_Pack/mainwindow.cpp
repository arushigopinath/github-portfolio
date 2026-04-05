#include "mainwindow.h"

#include <QWidget>
#include <QVBoxLayout>
#include <QFormLayout>
#include <QHBoxLayout>
#include <QLineEdit>
#include <QLabel>
#include <QPushButton>
#include <QIntValidator>
#include <QRegularExpression>
#include <QRegularExpressionValidator>
#include <QMessageBox>
#include <QStyle>

static QLabel* makeErrorLabel()
{
    auto* l = new QLabel;
    l->setWordWrap(true);
    l->setObjectName("errorLabel");
    l->setVisible(false);
    return l;
}

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
{
    setWindowTitle("Form Validator (Qt Widgets)");
    resize(700, 450);

    auto* root = new QWidget(this);
    auto* main = new QVBoxLayout(root);
    main->setContentsMargins(16, 16, 16, 16);
    main->setSpacing(12);

    auto* title = new QLabel(
        "<h2>Form Validator</h2>"
        "<p>Validators + live error messages (code-first)</p>");
    title->setTextFormat(Qt::RichText);
    main->addWidget(title);

    auto* formWrap = new QWidget(root);
    formWrap->setMaximumWidth(600);
    auto* form = new QFormLayout(formWrap);
    form->setLabelAlignment(Qt::AlignRight);
    form->setHorizontalSpacing(12);
    form->setVerticalSpacing(8);

    nameEdit = new QLineEdit;
    nameEdit->setPlaceholderText("e.g., Mia Patel");
    nameEdit->setAccessibleName("Full name");
    nameEdit->setMaxLength(40);

    ageEdit = new QLineEdit;
    ageEdit->setPlaceholderText("0 - 120");
    ageEdit->setAccessibleName("Age");
    ageEdit->setValidator(new QIntValidator(0, 120, ageEdit));

    emailEdit = new QLineEdit;
    emailEdit->setPlaceholderText("e.g., user@example.com");
    emailEdit->setAccessibleName("Email");

    postalEdit = new QLineEdit;
    postalEdit->setPlaceholderText("e.g., M5V 2T6");
    postalEdit->setAccessibleName("Canadian postal code");
    postalEdit->setMaxLength(7);

    // Canadian postal code: A1A 1A1 (space optional)
    QRegularExpression postalRx(R"(^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$)");
    postalEdit->setValidator(new QRegularExpressionValidator(postalRx, postalEdit));

    nameErr = makeErrorLabel();
    ageErr = makeErrorLabel();
    emailErr = makeErrorLabel();
    postalErr = makeErrorLabel();

    auto makeField = [&](QLineEdit* edit, QLabel* err) {
        auto* box = new QWidget;
        auto* col = new QVBoxLayout(box);
        col->setContentsMargins(0, 0, 0, 0);
        col->setSpacing(4);
        col->addWidget(edit);
        col->addWidget(err);
        return box;
    };

    form->addRow("Full name:", makeField(nameEdit, nameErr));
    form->addRow("Age:", makeField(ageEdit, ageErr));
    form->addRow("Email:", makeField(emailEdit, emailErr));
    form->addRow("Postal code:", makeField(postalEdit, postalErr));
    main->addWidget(formWrap, 0, Qt::AlignTop);
    main->addStretch();
    main->addWidget(formWrap);

    statusLabel = new QLabel;
    statusLabel->setObjectName("statusLabel");
    statusLabel->setWordWrap(true);
    main->addWidget(statusLabel);

    auto* actions = new QHBoxLayout;
    actions->addStretch(1);

    submitBtn = new QPushButton("Submit");
    submitBtn->setEnabled(false);
    submitBtn->setAccessibleName("Submit form");

    clearBtn = new QPushButton("Clear");
    clearBtn->setAccessibleName("Clear form");

    actions->addWidget(submitBtn);
    actions->addWidget(clearBtn);
    main->addLayout(actions);

    root->setStyleSheet(R"(
        #errorLabel { color: #b00020; }
        #statusLabel { color: #444; }
        QLineEdit[invalid="true"] { border: 1px solid #b00020; }
    )");

    setCentralWidget(root);

    connect(nameEdit, &QLineEdit::textChanged, this, &MainWindow::validateAll);
    connect(ageEdit, &QLineEdit::textChanged, this, &MainWindow::validateAll);
    connect(emailEdit, &QLineEdit::textChanged, this, &MainWindow::validateAll);
    connect(postalEdit, &QLineEdit::textChanged, this, &MainWindow::validateAll);

    connect(submitBtn, &QPushButton::clicked, this, &MainWindow::onSubmit);
    connect(clearBtn, &QPushButton::clicked, this, &MainWindow::onClear);

    validateAll();
}

void MainWindow::setError(QLabel* label, const QString& message)
{
    label->setText(message);
    label->setVisible(true);
}

void MainWindow::clearError(QLabel* label)
{
    label->clear();
    label->setVisible(false);
}

void MainWindow::refreshInvalidStyle(QWidget* w)
{
    w->style()->unpolish(w);
    w->style()->polish(w);
}

void MainWindow::validateAll()
{
    bool ok = true;

    const QString name = nameEdit->text().trimmed();
    if (name.size() < 2) {
        setError(nameErr, "Enter your name (at least 2 characters).");
        nameEdit->setProperty("invalid", true);
        ok = false;
    } else {
        clearError(nameErr);
        nameEdit->setProperty("invalid", false);
    }

    QString ageText = ageEdit->text().trimmed();
    int pos = 0;
    const QValidator* ageVal = ageEdit->validator();
    bool ageOk = !ageText.isEmpty() && ageVal && (ageVal->validate(ageText, pos) == QValidator::Acceptable);
    if (!ageOk) {
        setError(ageErr, "Age must be a number from 0 to 120.");
        ageEdit->setProperty("invalid", true);
        ok = false;
    } else {
        clearError(ageErr);
        ageEdit->setProperty("invalid", false);
    }

    QRegularExpression emailRx(R"(^[^\s@]+@[^\s@]+\.[^\s@]+$)");
    const QString email = emailEdit->text().trimmed();
    if (!emailRx.match(email).hasMatch()) {
        setError(emailErr, "Enter a valid email (example: user@example.com).");
        emailEdit->setProperty("invalid", true);
        ok = false;
    } else {
        clearError(emailErr);
        emailEdit->setProperty("invalid", false);
    }

    QString p = postalEdit->text().trimmed();
    pos = 0;
    const QValidator* postalVal = postalEdit->validator();
    bool postalOk = !p.isEmpty() && postalVal && (postalVal->validate(p, pos) == QValidator::Acceptable);
    if (!postalOk) {
        setError(postalErr, "Postal code format: A1A 1A1 (space optional).");
        postalEdit->setProperty("invalid", true);
        ok = false;
    } else {
        clearError(postalErr);
        postalEdit->setProperty("invalid", false);
    }

    refreshInvalidStyle(nameEdit);
    refreshInvalidStyle(ageEdit);
    refreshInvalidStyle(emailEdit);
    refreshInvalidStyle(postalEdit);

    submitBtn->setEnabled(ok);
    statusLabel->setText(ok ? "✅ Looks good. You can submit."
                            : "Fix the highlighted fields to enable Submit.");
}

void MainWindow::onClear()
{
    nameEdit->clear();
    ageEdit->clear();
    emailEdit->clear();
    postalEdit->clear();
    validateAll();
}

void MainWindow::onSubmit()
{
    QMessageBox::information(this, "Submitted",
                             "Form submitted!\n\n"
                             "This demo shows validators + live error messaging.");
}
