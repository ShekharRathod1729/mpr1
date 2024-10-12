var input = document.getElementById("enterPS");
input.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("login").click();
    }
});

async function check(form) {
    const password = form.psw.value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password })
        });

        const result = await response.json();

        if (result.success) {
            window.location.replace('add-student.html'); // Redirect on success
        } else {
            alert(result.message); // Show error message
        }
    } catch (error) {
        console.error('Error:', error);
        alert("An error occurred. Please try again.");
    }
}
