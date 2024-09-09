// Function to handle closing modals
function closeModal(event) {
    if (event.target.classList.contains('close') || event.target.classList.contains('cancelbtn')) {
        event.target.closest('.modal').style.display = 'none';
    }
}

// Add event listeners to close modals when clicking outside the form
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

// Add event listeners to all cancel buttons and close spans
document.querySelectorAll('.cancelbtn, .close').forEach(function(element) {
    element.addEventListener('click', closeModal);
});
