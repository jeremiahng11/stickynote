//Getting all registration input text object
var email1 = document.getElementById('email1');
var password1 = document.getElementById('password1');
var cpass = document.getElementById('cpass');

//Getting all Login input text object
var email = document.getElementById('email');
var password = document.getElementById('password');
var emailError = document.getElementById('emailError');
var passwordError = document.getElementById('passwordError');

//Getting all html object
var mailError = document.getElementById('mailError');
var passError = document.getElementById('passError');
var cpassError = document.getElementById('cpassError');

// URL  
var pathname = window.location.href.split('/');
var url = pathname[0]+"//"+pathname[2]+"/"

function register(){ 
    if((email1Validation()==true) && (password1Validation()==true)){      
        var xhttp= new XMLHttpRequest();
        xhttp.onreadystatechange = function(){
            if(this.readyState == 4 && this.status == 200 ){ 
                var res=JSON.parse(this.responseText)
                if(res.status == true){
                    let typeAlert='ok';
                    let message = res.message
                    isValid(typeAlert,message);
                    setTimeout(function(){
                        window.location.href = '/'
                    },500)
                }else{
                    let typeAlert='error';
                    let message = res.message
                    isValid(typeAlert,message);
                    email1Div.classList.remove('valid');
                    password1Div.classList.remove('valid')
                    cpassDiv.classList.remove('valid')
                }
            }
        }

        var requestData = `email=${email1.value}&&password=${password1.value}&&cpass=${cpass.value}`
        
        xhttp.open('post', url+ "login-register", true)
        xhttp.setRequestHeader('content-type','application/x-www-form-urlencoded')
        xhttp.send(requestData);
    }else{
        email1Validation();
        password1Validation();
    }
}

function email1Validation() {
    mailError.innerHTML = '';
    
    var regForm = document.getElementById('regForm'); 
    var email1Div = document.getElementById('email1Div');
    
    if (email1.value == '' || email1.value != '') {
        var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        if (email1.value == '' || !filter.test(email1.value)) {
            var text = "Please enter a valid email.";
            regForm.classList.remove('valid');
            regForm.classList.add('invalid');
            email1Div.classList.remove('valid');
            email1Div.classList.add('invalid');
            mailError.innerHTML= text;
            return false;
        }else{
            email1Div.classList.remove('invalid');
            email1Div.classList.add('valid');
            regForm.classList.remove('invalid');
            regForm.classList.add('valid');
            return true;
        }
    }
}

function password1Validation() {
    passError.innerHTML = '';
    cpassError.innerHTML = '';
    var password1Div = document.getElementById('password1Div');
    var cpassDiv = document.getElementById('cpassDiv');
    var regForm = document.getElementById('regForm'); 
   
    if (password1.value == '') {
        var text = "Password is required.";
        regForm.classList.remove('valid');
        regForm.classList.add('invalid');
        password1Div.classList.remove('valid');
        password1Div.classList.add('invalid');
        cpassDiv.classList.add('invalid');
        passError.innerHTML= text;
        return false;
    }else if(password1.value != ''){ 
        if(password1.value.length < 6) { 
            var text = "Password must be at least 6 characters long."
            password1Div.classList.remove('valid');
            password1Div.classList.add('invalid');
            cpassDiv.classList.add('invalid');
            passError.innerHTML= text;
            cpassError.innerHTML= 'Password do not match.';
            return false;
        }else{
            password1Div.classList.remove('invalid'); 
            password1Div.classList.add('valid');
            if(cpass.value == ''){  
                var text = "Password do not match.";
                cpassDiv.classList.add('invalid');
                cpassError.innerHTML= text;
                return false;
            }else if(password1.value != cpass.value){
                var text = "Password do not match.";
                cpassDiv.classList.add('invalid');
                cpassError.innerHTML= text;
                return false;
            }else{
                cpassDiv.classList.remove('invalid');
                cpassDiv.classList.add('valid');
                regForm.classList.remove('invalid');
                regForm.classList.add('valid');
                return true;
            }
        }
    }
}

$('.input_wrap.reg input').keypress(function(event){
    if(event.keyCode === 13){
        $('#button1').click();
    }
});

function login(){
    if((emailValidation()==true) && (passwordValidation()==true)){
        var xhttp= new XMLHttpRequest();
        xhttp.onreadystatechange = function(){
            if(this.readyState == 4 && this.status == 200 ){ 
                var res=JSON.parse(this.responseText)
                if(res.status == true){
                    let typeAlert='ok';
                    let message = res.message
                    isValid(typeAlert,message);
                    setTimeout(function(){
                        window.location.href = 'stickyBoard/';
                    },500)
                }else{
                    let typeAlert='error';
                    let message = res.message
                    isValid(typeAlert,message);
                    password.value='';
                    emailDiv.classList.remove('valid');
                    passwordDiv.classList.remove('valid');
                }
            }
        }
        var requestData = `email=${email.value}&&password=${password.value}`
        
        xhttp.open('post', url+ "login-register", true)
        xhttp.setRequestHeader('content-type','application/x-www-form-urlencoded')
        xhttp.send(requestData);
    }else{
        emailValidation();
        passwordValidation()
    }

}

function emailValidation() {
    emailError.innerHTML = '';
    var loginForm = document.getElementById('loginform'); 
    var emailDiv = document.getElementById('emailDiv');
    
    if (email.value == '' || email.value != '') {
        var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        if (!filter.test(email.value)) {
            var text = "Please enter a valid email.";
            loginForm.classList.add('invalid');
            emailDiv.classList.remove('valid');
            emailDiv.classList.add('invalid');
            emailError.innerHTML= text;
        }else{
            emailDiv.classList.remove('invalid');
            emailDiv.classList.add('valid');
            loginForm.classList.remove('invalid');
            return true;
        }
    }
}

function passwordValidation() {
    passwordError.innerHTML = '';
    var passwordDiv = document.getElementById('passwordDiv');
    
    if (password.value == '') {
        var text = "Password is required.";
        passwordDiv.classList.remove('valid');
        passwordDiv.classList.add('invalid');
        passwordError.innerHTML= text;
    }else if(password.value != ''){ 
        if(password.value.length < 6) {
            var text = "Password must be at least 6 characters long."
            passwordDiv.classList.remove('valid');
            passwordDiv.classList.add('invalid');
            passwordError.innerHTML= text;
        }else{
            passwordDiv.classList.remove('invalid'); 
            passwordDiv.classList.add('valid');    
            return true;
        }
    }
}

$('.input_wrap.login input').keypress(function(event){
    if(event.keyCode === 13){
        $('#button').click();
    }
});

function isValid(typeAlert,message) { 
	if(typeAlert=='ok')
	{
		$('.msg').addClass('alert_open');
		$('.msg').addClass('note_success');
		$(".alert_text").text(message);
		setTimeout(function(){ $('.msg').removeClass('alert_open'); }, 3000);
		setTimeout(function(){ $('.msg').removeClass('note_success'); }, 3300);
	}
	else
	{
		$('document').ready(function(){
			$('.msg').addClass('alert_open');
			$('.msg').addClass('note_error');
			$(".alert_text").text(message);
			setTimeout(function(){ $('.msg').removeClass('alert_open'); }, 3000);
			setTimeout(function(){ $('.msg').removeClass('note_error'); }, 3300);
		});
	}
}

// var el_down = document.getElementById("geeks"); 
  
/* Function to generate combination of password */ 
function generateP() { 
    if(forgotEmailValidation()){
        var pass = ''; 
        var str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +  
                'abcdefghijklmnopqrstuvwxyz0123456789@#$'; 
            
        for (i = 1; i <= 8; i++) { 
            var char = Math.floor(Math.random() 
                        * str.length + 1); 
                
            pass += str.charAt(char) 
        } 
        
        var xhttp= new XMLHttpRequest();
            xhttp.onreadystatechange = function(){
                if(this.readyState == 4 && this.status == 200 ){ 
                    var res=JSON.parse(this.responseText)
                    console.log(res)
                    if(res.status == true){
                        let typeAlert='ok';
                        let message = res.message
                        isValid(typeAlert,message);
                        setTimeout(function(){
                            window.location.href = '/';
                        },500)
                    }else{
                        let typeAlert='error';
                        let message = res.message
                        isValid(typeAlert,message);                   
                    }
                }
            }
        
        var requestData = `email=${forgot_email.value}&&newPassword=${pass}`
            
        xhttp.open('post', url+ "forgot-password", true)
        xhttp.setRequestHeader('content-type','application/x-www-form-urlencoded')
        xhttp.send(requestData);
    }else{
        forgotEmailValidation()
    }
} 

function forgotEmailValidation() {
    forgotEmailError.innerHTML = '';
    
    if (forgot_email.value == '' || forgot_email.value != '') {
        var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        if (!filter.test(forgot_email.value)) {
            var text = "Please enter a valid email.";
            forgotEmailDiv.classList.remove('valid');
            forgotEmailDiv.classList.add('invalid');
            forgotEmailError.innerHTML= text;
        }else{
            forgotEmailDiv.classList.remove('invalid');
            forgotEmailDiv.classList.add('valid');
            return true;
        }
    }
} 

