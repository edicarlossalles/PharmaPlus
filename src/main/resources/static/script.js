const API_URL = "http://localhost:8080";

async function logar(){

const matricula = parseInt(document.getElementById("login").value);
const senha = document.getElementById("senha").value;

const btn = document.querySelector(".btn-main");
const msg = document.getElementById("msg-login");

if(!matricula || isNaN(matricula)){
mostrarMsg(msg,"error","Informe uma matrícula válida.");
return;
}

if(!senha){
mostrarMsg(msg,"error","Informe sua senha.");
return;
}

btn.disabled=true;
btn.textContent="Entrando...";

try{

const res = await fetch(`${API_URL}/usuarios/login`,{

method:"POST",
headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
matricula,
senha
})

});

const data = await res.json();

if(data.sucesso){

localStorage.setItem("token",data.token);

btn.textContent="Redirecionando...";

window.location.href="home.html";

}else{

mostrarMsg(msg,"error",data.mensagem || "Login inválido.");

btn.disabled=false;
btn.textContent="Entrar";

}

}catch(e){

mostrarMsg(msg,"error","Erro ao conectar com o servidor.");

btn.disabled=false;
btn.textContent="Entrar";

}

}

function toggleSenhaLogin(btn){

const inp = document.getElementById("senha");

if(inp.type==="password"){
inp.type="text";
btn.textContent="🙈";
}else{
inp.type="password";
btn.textContent="👁";
}

}

function mostrarMsg(el,tipo,texto){

el.className=`msg ${tipo}`;
el.textContent=texto;

}

document.addEventListener("DOMContentLoaded",()=>{

["login","senha"].forEach(id=>{

document.getElementById(id).addEventListener("keydown",e=>{

if(e.key==="Enter") logar();

});

});

});