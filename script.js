function scrollToSection(sectionId) {
    var section = document.getElementById(sectionId);
    if (section) {
        // Faire défiler jusqu'à la section avec un effet de transition
        window.scrollTo({
            top: section.offsetTop,
            behavior: 'smooth'
        });
    }
}

function ouvrirCV() {
    window.open('fichiers/Timothée_Imaho_CV.pdf', '_blank');
}

function openModal(id) {
    document.getElementById(id).style.display = 'flex'; // Affiche correctement
}
  
function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}
  
// Ferme le modal en cliquant à l'extérieur
window.onclick = function(event) {
    document.querySelectorAll('.modal').forEach(modal => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
}

function showInfo(id) {
    document.getElementById(id).style.display = 'block';
}
  
function hideInfo(id) {
    document.getElementById(id).style.display = 'none';
}

// Fonction pour afficher/masquer les informations en dessous de la timeline
function toggleInfo(point) {
    // Cache toutes les informations
    const infos = document.querySelectorAll('.information');
        infos.forEach(info => {
        info.style.display = 'none';
    });
  
    // Ajoute la classe 'clicked' au point cliqué pour l'agrandir et montre l'information associée
    const pointElement = document.querySelector(`.point:nth-child(${point === 'bac' ? 1 : 2})`);
    pointElement.classList.toggle('clicked');
    
    const infoElement = document.getElementById(point);
    infoElement.style.display = pointElement.classList.contains('clicked') ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    const radios = document.querySelectorAll('.timeline-radio');
    const parcours = document.querySelector('.parcours');

    let lastChecked = null;

    radios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.checked) {
                // Si le radio est coché, ajuste la marge en fonction du contenu
                const contentHeight = radio.nextElementSibling.nextElementSibling.offsetHeight;
                parcours.style.marginBottom = `16rem`;
                lastChecked = radio;
            }
        });

        radio.addEventListener('click', (event) => {
            if (lastChecked === radio) {
                // Si on clique sur le même radio → on le désélectionne
                event.preventDefault(); // Empêche le comportement par défaut
                radio.checked = false;
                parcours.style.marginBottom = '0';
                lastChecked = null;
            }
        });
    });
});