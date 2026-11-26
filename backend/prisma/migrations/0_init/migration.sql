-- CreateTable
CREATE TABLE `images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom_fichier` VARCHAR(255) NOT NULL,
    `chemin` VARCHAR(500) NOT NULL,
    `type_mime` VARCHAR(100) NOT NULL,
    `alt` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(150) NOT NULL,
    `nom_fichier` VARCHAR(255) NOT NULL,
    `chemin` VARCHAR(500) NOT NULL,
    `type_mime` VARCHAR(100) NOT NULL,
    `taille` INTEGER NULL,
    `date_ajout` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `description` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profil` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(100) NOT NULL,
    `prenom` VARCHAR(100) NOT NULL,
    `photo_id` INTEGER NULL,
    `titre` VARCHAR(150) NULL,
    `email` VARCHAR(255) NULL,
    `telephone` VARCHAR(30) NULL,
    `localisation` VARCHAR(255) NULL,
    `date_naissance` DATE NULL,
    `presentation` TEXT NULL,

    INDEX `fk_profil_photo`(`photo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories_competences` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `nom`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `competences` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(100) NOT NULL,
    `image_id` INTEGER NULL,
    `categorie_id` INTEGER NOT NULL,

    UNIQUE INDEX `nom`(`nom`),
    INDEX `fk_competence_categorie`(`categorie_id`),
    INDEX `fk_competence_image`(`image_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `image_principale_id` INTEGER NULL,
    `lien_github` VARCHAR(500) NULL,
    `lien_projet` VARCHAR(500) NULL,
    `date` DATE NULL,

    INDEX `fk_projet_image_principale`(`image_principale_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projet_competences` (
    `projet_id` INTEGER NOT NULL,
    `competence_id` INTEGER NOT NULL,

    INDEX `fk_projet_competence_competence`(`competence_id`),
    PRIMARY KEY (`projet_id`, `competence_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projet_images` (
    `projet_id` INTEGER NOT NULL,
    `image_id` INTEGER NOT NULL,

    INDEX `fk_projet_image_image`(`image_id`),
    PRIMARY KEY (`projet_id`, `image_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `experiences` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `poste` VARCHAR(150) NOT NULL,
    `entreprise` VARCHAR(150) NOT NULL,
    `date_debut` DATE NULL,
    `date_fin` DATE NULL,
    `en_cours` BOOLEAN NOT NULL DEFAULT false,
    `description` TEXT NULL,
    `logo_id` INTEGER NULL,
    `lieu` VARCHAR(255) NULL,

    INDEX `fk_experience_logo`(`logo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `formations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(150) NOT NULL,
    `specialite` VARCHAR(150) NULL,
    `etablissement` VARCHAR(150) NOT NULL,
    `lien_etablissement` VARCHAR(500) NULL,
    `date_debut` DATE NULL,
    `date_fin` DATE NULL,
    `lieu` VARCHAR(255) NULL,
    `diplome` VARCHAR(150) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `certifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(150) NOT NULL,
    `image_id` INTEGER NULL,

    INDEX `fk_certification_image`(`image_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `langues` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(100) NOT NULL,
    `niveau` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `centres_interet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `image_id` INTEGER NULL,

    INDEX `fk_centre_interet_image`(`image_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reseaux_sociaux` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(100) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `icone_id` INTEGER NULL,

    INDEX `fk_reseau_icone`(`icone_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `utilisateurs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `mot_de_passe` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL,
    `totp_secret_chiffre` VARCHAR(255) NULL,
    `totp_active` BOOLEAN NOT NULL DEFAULT false,
    `tentatives_echouees` INTEGER NOT NULL DEFAULT 0,
    `verrouille_jusqu_a` DATETIME(0) NULL,
    `derniere_connexion` DATETIME(0) NULL,
    `date_creation` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `codes_recuperation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utilisateur_id` INTEGER NOT NULL,
    `code_hash` VARCHAR(255) NOT NULL,
    `date_utilisation` DATETIME(0) NULL,

    INDEX `fk_code_recuperation_utilisateur`(`utilisateur_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utilisateur_id` INTEGER NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `etape` ENUM('en_attente_2fa', 'active') NOT NULL DEFAULT 'en_attente_2fa',
    `date_creation` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `derniere_activite` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `date_expiration` DATETIME(0) NOT NULL,
    `adresse_ip` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,

    UNIQUE INDEX `token_hash`(`token_hash`),
    INDEX `fk_session_utilisateur`(`utilisateur_id`),
    INDEX `idx_session_expiration`(`date_expiration`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `profil` ADD CONSTRAINT `fk_profil_photo` FOREIGN KEY (`photo_id`) REFERENCES `images`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `competences` ADD CONSTRAINT `fk_competence_categorie` FOREIGN KEY (`categorie_id`) REFERENCES `categories_competences`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `competences` ADD CONSTRAINT `fk_competence_image` FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projets` ADD CONSTRAINT `fk_projet_image_principale` FOREIGN KEY (`image_principale_id`) REFERENCES `images`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projet_competences` ADD CONSTRAINT `fk_projet_competence_competence` FOREIGN KEY (`competence_id`) REFERENCES `competences`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projet_competences` ADD CONSTRAINT `fk_projet_competence_projet` FOREIGN KEY (`projet_id`) REFERENCES `projets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projet_images` ADD CONSTRAINT `fk_projet_image_image` FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projet_images` ADD CONSTRAINT `fk_projet_image_projet` FOREIGN KEY (`projet_id`) REFERENCES `projets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `experiences` ADD CONSTRAINT `fk_experience_logo` FOREIGN KEY (`logo_id`) REFERENCES `images`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certifications` ADD CONSTRAINT `fk_certification_image` FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `centres_interet` ADD CONSTRAINT `fk_centre_interet_image` FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reseaux_sociaux` ADD CONSTRAINT `fk_reseau_icone` FOREIGN KEY (`icone_id`) REFERENCES `images`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `codes_recuperation` ADD CONSTRAINT `fk_code_recuperation_utilisateur` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `fk_session_utilisateur` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

