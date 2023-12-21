<?php

//Envoi formualaire
if ($_SERVER["REQUEST_METHOD"] == "POST") {
  $nom = htmlspecialchars($_POST["nom"]);
  $email = htmlspecialchars($_POST["email"]);
  $telephone = htmlspecialchars($POST["telephone"])
  $message = htmlspecialchars($_POST["message"]);

  // Destinataire (votre adresse e-mail)
  $destinataire = "timotheeimaho@icloud.com";

  // Sujet du message
  $sujet = "Nouveau message depuis le formulaire de contact (Portfolio)";

  // Corps du message
  $corps_message = "Nom : $nom\n";
  $corps_message .= "E-mail : $email\n";
  $corps_message .= "Telephone : $telephone\n";
  $corps_message .= "Message :\n$message";

  // Envoi du message
  if (mail($destinataire, $sujet, $corps_message)) {
    echo "Votre message a été envoyé avec succès.";
  } else {
    echo "Erreur lors de l'envoi du message.";
  }
} else {
  echo "Le formulaire n'a pas été soumis.";
}
?>
