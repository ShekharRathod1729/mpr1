document.addEventListener('DOMContentLoaded', () => {
    const studentsTable = document.getElementById('studentsTable');
    const marksModal = document.getElementById('marksModal');
    const closeButton = document.querySelector('.close-button');
    const modalForm = document.getElementById('modalForm');
    const modalFormFields = document.getElementById('modalFormFields');
    const modalResponse = document.getElementById('modalResponse');
    const searchBar = document.getElementById('searchBar');
    const searchButton = document.getElementById('searchButton');

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
    let allStudents = [];

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
        modalFormFields.innerHTML = '';
        const student = Object.values(studentsByClass).flat().find(student => student.rollNo === rollNo);

        if (student) {
            document.getElementById('studentRollNo').value = rollNo;
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
        console.log('Form submission attempted');
        
        const formData = new FormData(modalForm);
        const data = {};
        let rollNo;

        formData.forEach((value, key) => {
            data[key] = value;
            console.log(`${key}: ${value}`);
            if (key === 'rollNo') {
                rollNo = value;
            }
        });

        if (!rollNo) {
            console.error('Roll number is missing');
            alert('Error: Roll number is required');
            return;
        }

        try {
            console.log('Sending data:', JSON.stringify(data));
            const response = await fetch('/add-marks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            console.log('Response received:', response.status);
            const result = await response.text();
            console.log('Response body:', result);

            if (response.ok) {
                alert("Marks have been successfully added!");
                modalResponse.innerText = 'Marks added successfully.';
                marksModal.style.display = 'none';
            } else {
                alert("Error adding marks: " + result);
                modalResponse.innerText = result;
            }
        } catch (error) {
            console.error('Error:', error);
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

    function searchStudents() {
        const query = searchBar.value.trim().toLowerCase();
        const filteredStudents = allStudents.filter(student => student.rollNo.toLowerCase().includes(query));
        populateTable(filteredStudents);
    }

    searchButton.addEventListener('click', searchStudents);

    // Fetch all students and populate the table
    fetch('/students')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            studentsByClass = data;
            allStudents = [];
            Object.values(studentsByClass).forEach(classStudents => {
                allStudents.push(...classStudents);
            });
            populateTable(allStudents);
        })
        .catch(error => {
            console.error('Error fetching students:', error);
            studentsTable.querySelector('tbody').innerHTML = '<tr><td colspan="3">Error fetching student data. Please try again later.</td></tr>';
        });
});