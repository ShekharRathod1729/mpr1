document.addEventListener('DOMContentLoaded', () => {
    const studentsTable = document.getElementById('studentsTable');
    const marksModal = document.getElementById('marksModal');
    const closeButton = document.querySelector('.close-button');
    const modalForm = document.getElementById('modalForm');
    const modalFormFields = document.getElementById('modalFormFields');
    const modalResponse = document.getElementById('modalResponse');

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

    let studentsByClass = {};

    function populateTable(students) {
        const tableBody = studentsTable.querySelector('tbody');
        if (students.length) {
            tableBody.innerHTML = students.map(student => `
            <tr>
                <td>${student.rollNo}</td>
                <td>${student.sname}</td>
                <td><button data-rollno="${student.rollNo}" class="add-modify-btn">Add/Modify</button></td>
            </tr>
            `).join('');
        } else {
            tableBody.innerHTML = '<tr><td colspan="3">No students found</td></tr>';
        }
    }

    function showModal(rollNo) {
        modalFormFields.innerHTML = ''; // Clear previous fields
        const student = Object.values(studentsByClass).flat().find(student => student.rollNo === rollNo);

        if (student) {
            const studentYear = student.class; 
            if (subjects[studentYear]) {
                modalFormFields.innerHTML = subjects[studentYear].map(subject => `
                <div>
                    <label>${subject}</label>
                    <input type="number" name="${subject}" placeholder="Enter marks" min="0" max="100">
                </div>
                `).join('');
            } else {
                modalFormFields.innerHTML = '<p>Unable to determine student year.</p>';
            }

            // Fetch and display existing marks
            fetch(`/marks?rollNo=${rollNo}`)
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(marks => {
                    marks.forEach(mark => {
                        const inputField = modalFormFields.querySelector(`input[name="${mark.subject}"]`);
                        if (inputField) {
                            inputField.value = mark.marks;
                        }
                    });
                })
                .catch(error => {
                    console.error('Error fetching marks:', error);
                    modalResponse.innerText = 'Error fetching marks.';
                });

            marksModal.style.display = 'block';
        } else {
            modalFormFields.innerHTML = '<p>Unable to find student data.</p>';
        }
    }

    closeButton.addEventListener('click', () => {
        marksModal.style.display = 'none';
    });

    modalForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(modalForm);
        const data = new URLSearchParams(formData).toString();

        try {
            const response = await fetch('/add-marks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: data,
            });

            const result = await response.text();
            if (response.ok) {
                alert("Marks have been successfully added!");
                modalResponse.innerText = 'Marks added successfully.';
            } else {
                alert("Error adding marks: " + result);
                modalResponse.innerText = result;
            }
        } catch (error) {
            alert("An unexpected error occurred: " + error.message);
            modalResponse.innerText = 'Error adding marks.';
        }
    });

    studentsTable.addEventListener('click', (event) => {
        if (event.target && event.target.classList.contains('add-modify-btn')) {
            const rollNo = event.target.getAttribute('data-rollno');
            showModal(rollNo);
        }
    });

    fetch('/students')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            studentsByClass = data;
            const students = [];
            Object.values(studentsByClass).forEach(classStudents => {
                students.push(...classStudents);
            });
            populateTable(students);
        })
        .catch(error => {
            console.error('Error fetching students:', error);
            studentsTable.querySelector('tbody').innerHTML = '<tr><td colspan="3">Error fetching student data. Please try again later.</td></tr>';
        });
});
