#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>

class QLineEdit;
class QLabel;
class QPushButton;

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    explicit MainWindow(QWidget *parent = nullptr);

private slots:
    void validateAll();
    void onSubmit();
    void onClear();

private:
    void setError(QLabel* label, const QString& message);
    void clearError(QLabel* label);
    void refreshInvalidStyle(QWidget* w);

    QLineEdit* nameEdit{};
    QLineEdit* ageEdit{};
    QLineEdit* emailEdit{};
    QLineEdit* postalEdit{};

    QLabel* nameErr{};
    QLabel* ageErr{};
    QLabel* emailErr{};
    QLabel* postalErr{};
    QLabel* statusLabel{};

    QPushButton* submitBtn{};
    QPushButton* clearBtn{};
};

#endif // MAINWINDOW_H
