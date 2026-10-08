<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $firstName = htmlspecialchars(stripslashes(trim($_POST["Nom"])));
    $lastName = htmlspecialchars(stripslashes(trim($_POST["Prenom"])));
    $email = filter_var(trim($_POST["Email"]), FILTER_SANITIZE_EMAIL);
    $message = htmlspecialchars(stripslashes(trim($_POST["Message"])));

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo "Invalid email format";
        exit;
    }

    $to = 'timotheeimaho@icloud.com'; // << UPDATE with your desired email address
    $subject = 'New Contact from portfolio';
    $body = "You have received a new message from $firstName $lastName ($email):\n\n$message";
    $headers = "From: $email\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    if (mail($to, $subject, $body, $headers)) {
        echo "Thank you for contacting us, $firstName. We will get back to you shortly.";
    } else {
        echo "There was a problem sending your message. Please try again.";
    }
} else {
    // Not a POST request
    echo "Error: Form must be submitted.";
}
?>
