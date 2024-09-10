document.addEventListener('DOMContentLoaded', () => {
    const studentsTable = document.getElementById('studentsTable');
    const marksModal = document.getElementById('marksModal');
    const closeButton = document.querySelector('.close-button');
    const modalForm = document.getElementById('modalForm');
    const modalFormFields = document.getElementById('modalFormFields');
    const modalResponse = document.getElementById('modalResponse');

    // Debugging: Check if elements are correctly selected
    console.log('studentsTable:', studentsTable);
    console.log('marksModal:', marksModal);
    console.log('closeButton:', closeButton);
    console.log('modalForm:', modalForm);
    console.log('modalFormFields:', modalFormFields);
    console.log('modalResponse:', modalResponse);

    if (!studentsTable || !marksModal || !closeButton || !modalForm || !modalFormFields || !modalResponse) {
        console.error('One or more required elements are missing in the HTML.');
        return;
    }

    // Define the subjects for each year
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

    let studentsByClass = {}; // Store student data including their year

    // Function to populate the table based on student data
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

    // Function to show modal and set up the form fields
    function showModal(rollNo) {
        modalFormFields.innerHTML = ''; // Clear previous fields
        const student = Object.values(studentsByClass).flat().find(student => student.rollNo === rollNo);
        const studentYear = student ? student.year : null;
        if (studentYear && subjects[studentYear]) {
            modalFormFields.innerHTML = subjects[studentYear].map(subject => `
                <div>
                    <label>${subject}</label>
                    <input type="number" name="${subject}" placeholder="Enter marks" min="0">
                </div>
            `).join('');
        } else {
            modalFormFields.innerHTML = '<p>Unable to determine student year.</p>';
        }
        marksModal.style.display = 'block';
    }

    // Close modal
    closeButton.addEventListener('click', () => {
        marksModal.style.display = 'none';
    });

    // Handle form submission in modal
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

    // Event delegation to handle Add/Modify button clicks
    studentsTable.addEventListener('click', (event) => {
        if (event.target && event.target.classList.contains('add-modify-btn')) {
            const rollNo = event.target.getAttribute('data-rollno');
            showModal(rollNo);
        }
    });

    // Fetch and populate student data
    fetch('/students')
        .then(response => response.json())
        .then(data => {
            studentsByClass = data;
            console.log('Fetched student data:', studentsByClass); // Log fetched data
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
