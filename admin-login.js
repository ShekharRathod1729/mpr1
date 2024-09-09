function check(form) {
    if(form.psw.value == "welcome1234") {
        window.location.replace('admin.html')
    }
    else {
        alert("Incorrect password!")
    }
}   