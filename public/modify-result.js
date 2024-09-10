document.addEventListener('DOMContentLoaded', () => {
    const studentsTable = document.getElementById('studentsTable').getElementsByTagName('tbody')[0];
    const modal = document.getElementById('marksModal');
    const closeButton = document.querySelector('.close-button');
    const modalForm = document.getElementById('modalForm');
    const modalFormFields = document.getElementById('modalFormFields');
    const modalResponse = document.getElementById('modalResponse');

    // Function to fetch and display students
    async function loadStudents() {
        try {
            const response = await fetch('/students');
            if (!response.ok) {
                throw new Error('Error fetching students');
            }
            const studentsByClass = await response.json();

            Object.keys(studentsByClass).forEach(studentClass => {
                studentsByClass[studentClass].forEach(student => {
                    const row = studentsTable.insertRow();
                    row.innerHTML = `
                        <td>${student.rollNo}</td>
                        <td>${student.sname}</td>
                        <td><button data-rollno="${student.rollNo}" data-class="${studentClass}">Add/Modify</button></td>
                    `;
                });
            });

            // Add event listeners for the Add/Modify buttons
            studentsTable.addEventListener('click', event => {
                if (event.target.tagName === 'BUTTON') {
                    const rollNo = event.target.dataset.rollno;
                    const studentClass = event.target.dataset.class;
                    openModal(rollNo, studentClass);
                }
            });
        } catch (error) {
            console.error('Error loading students:', error);
        }
    }

    // Function to open the modal and populate it with form fields
    function openModal(rollNo, studentClass) {
        modalFormFields.innerHTML = getSubjectFields(studentClass);
        modal.dataset.rollno = rollNo;
        modal.dataset.studentClass = studentClass;
        modal.style.display = 'block';
    }

    // Function to generate form fields based on student class
    function getSubjectFields(studentClass) {
        const subjects = {
            'First Year': [
                'Engineering Mathematics-I',
                'Engineering Physics',
                'Engineering Chemistry',
                'C Programming',
                'Basic Electrical Engineering'
            ],
            'Second Year': [
                'Engineering Mathematics-II',
                'Data Structures',
                'Digital Logic and Computer Architecture',
                'Computer Graphics',
                'Discrete Mathematics'
            ],
            'Third Year': [
                'Engineering Mathematics-III',
                'Analysis of Algorithms',
                'Database Management System',
                'Operating System',
                'Microprocessor'
            ],
            'Fourth Year': [
                'Engineering Mathematics-IV',
                'Theoretical Computer Science',
                'Software Engineering',
                'Internet Programming',
                'Cryptography'
            ]
        };

        return (subjects[studentClass] || []).map(subject => `
            <label for="${subject}">${subject}:</label>
            <input type="number" id="${subject}" name="${subject}" min="0" max="100"><br>
        `).join('');
    }

    // Close the modal
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Handle modal form submission
    modalForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const rollNo = modal.dataset.rollno;
        const formData = new FormData(modalForm);
        const data = new URLSearchParams(formData).toString();

        try {
            const response = await fetch('/add-marks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: data + `&rollNo=${rollNo}`,
            });

            const result = await response.text();
            if (response.ok) {
                alert("Marks have been successfully added/modified!");
            } else {
                alert("Error adding/modifying marks: " + result);
            }
            modalResponse.innerText = result;
        } catch (error) {
            alert("An unexpected error occurred: " + error.message);
            modalResponse.innerText = 'Error adding/modifying marks.';
        }
    });

    // Load students when page is ready
    loadStudents();
});
