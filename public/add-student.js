document.addEventListener('DOMContentLoaded', () => {
    const addStudentForm = document.getElementById('addStudentForm');
    const modifyStudentForm = document.getElementById('modifyStudentForm');
    const deleteStudentForm = document.getElementById('deleteStudentForm');

    // Close modals when close or cancel buttons are clicked
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

    // Handle Add Student Form submission
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
                fetchStudents(); // Refresh the student list
            } else {
                alert("Error adding student: " + result);
            }
            document.getElementById('addStudentResponse').innerText = result;
        } catch (error) {
            alert("An unexpected error occurred: " + error.message);
            document.getElementById('addStudentResponse').innerText = 'Error adding student.';
        }
    });

    // Handle Modify Student Form submission
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
                fetchStudents(); // Refresh the student list
            } else {
                alert("Error modifying student details: " + result);
            }
            document.getElementById('modifyStudentResponse').innerText = result;
        } catch (error) {
            alert("An unexpected error occurred: " + error.message);
            document.getElementById('modifyStudentResponse').innerText = 'Error modifying student details.';
        }
    });

    // Handle Delete Student Form submission
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
                fetchStudents(); // Refresh the student list
            } else {
                alert("Error deleting student: " + result);
            }
            document.getElementById('deleteStudentResponse').innerText = result;
        } catch (error) {
            alert("An unexpected error occurred: " + error.message);
            document.getElementById('deleteStudentResponse').innerText = 'Error deleting student.';
        }
    });

    // Fetch and display students
    async function fetchStudents() {
        try {
            const response = await fetch('/students');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const studentsByClass = await response.json();
            displayStudents(studentsByClass);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    }

    function displayStudents(studentsByClass) {
        const container = document.getElementById('studentListContainer');
        container.innerHTML = ''; // Clear previous content

        Object.keys(studentsByClass).forEach(studentClass => {
            const students = studentsByClass[studentClass];

            // Sort students by roll number
            students.sort((a, b) => {
                return a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true });
            });

            // Create a heading for the class
            const heading = document.createElement('h3');
            heading.textContent = `${studentClass} Students`;
            container.appendChild(heading);

            // Create a table for the students
            const table = document.createElement('table');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Roll No</th>
                        <th>Name</th>
                        <th>Date of Birth</th>
                        <th>Modify</th>
                        <th>Delete</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.map(student => `
                        <tr>
                            <td>${student.rollNo}</td>
                            <td>${student.sname}</td>
                            <td>${student.birthDate}</td>
                            <td><button class="modify-btn" data-rollno="${student.rollNo}">Modify</button></td>
                            <td><button class="delete-btn" data-rollno="${student.rollNo}">Delete</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
            container.appendChild(table);
        });

        // Add event listeners for the Modify and Delete buttons
        document.querySelectorAll('.modify-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const rollNo = event.target.getAttribute('data-rollno');
                document.getElementById('rollNoModify').value = rollNo;
                document.getElementById('modifyStudentModal').style.display = 'block';
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const rollNo = event.target.getAttribute('data-rollno');
                document.getElementById('rollNoDelete').value = rollNo;
                document.getElementById('deleteStudentModal').style.display = 'block';
            });
        });
    }

    // Initial fetch to display students on page load
    fetchStudents();
});
