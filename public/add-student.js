function closeModal(event) {
    if (event.target.classList.contains('close') || event.target.classList.contains('cancelbtn')) {
        event.target.closest('.modal').style.display = 'none';
    }
}

window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

document.querySelectorAll('.cancelbtn, .close').forEach(function(element) {
    element.addEventListener('click', closeModal);
});

document.addEventListener('DOMContentLoaded', () => {
    const addStudentForm = document.getElementById('addStudentForm');
    const modifyStudentForm = document.getElementById('modifyStudentForm');
    const deleteStudentForm = document.getElementById('deleteStudentForm');

    addStudentForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(addStudentForm);
        const data = new URLSearchParams(formData).toString();

        try {
            const response = await fetch('/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: data,
            });

            const result = await response.text();
            if (response.ok) {
                alert("New student has been successfully added!");
            } else {
                alert("Error adding student: " + result);
            }
            document.getElementById('addStudentResponse').innerText = result;
        } catch (error) {
            alert("An unexpected error occurred: " + error.message);
            document.getElementById('addStudentResponse').innerText = 'Error adding student.';
        }
    });

    modifyStudentForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(modifyStudentForm);
        const data = new URLSearchParams(formData).toString();

        try {
            const response = await fetch('/modify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: data,
            });

            const result = await response.text();
            if (response.ok) {
                alert("Student details have been successfully modified!");
            } else {
                alert("Error modifying student details: " + result);
            }
            document.getElementById('modifyStudentResponse').innerText = result;
        } catch (error) {
            alert("An unexpected error occurred: " + error.message);
            document.getElementById('modifyStudentResponse').innerText = 'Error modifying student details.';
        }
    });

    deleteStudentForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(deleteStudentForm);
        const data = new URLSearchParams(formData).toString();

        try {
            const response = await fetch('/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: data,
            });

            const result = await response.text();
            if (response.ok) {
                alert("Student has been successfully deleted!");
            } else {
                alert("Error deleting student: " + result);
            }
            document.getElementById('deleteStudentResponse').innerText = result;
        } catch (error) {
            alert("An unexpected error occurred: " + error.message);
            document.getElementById('deleteStudentResponse').innerText = 'Error deleting student.';
        }
    });
});