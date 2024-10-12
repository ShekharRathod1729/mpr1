var input = document.getElementById("enterPS");
input.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("login").click();
    }
});

function check(form) {    
    if(form.psw.value == "welcome1234") {
        window.location.replace('add-student.html');
    }
    else {
        alert("Incorrect password!");
    }
}   
