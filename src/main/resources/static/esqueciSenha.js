const API_URL="http://localhost:8080";

async function verificarMatricula(){

const matricula=document.getElementById("matricula").value;

const msg=document.getElementById("msg");

if(!matricula){

mostrarMsg(msg,"error","Informe a matrícula.");

return;

}

try{

const res=await fetch(`${API_URL}/usuarios/verificar-matricula`,{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
matricula:parseInt(matricula)
})

});

const data=await res.json();

if(data.sucesso){

mostrarMsg(msg,"success","Código enviado para o email cadastrado.");

}else{

mostrarMsg(msg,"error",data.mensagem);

}

}catch(e){

mostrarMsg(msg,"error","Erro ao conectar com o servidor.");

}

}

function mostrarMsg(el,tipo,texto){

el.className=`msg ${tipo}`;
el.textContent=texto;

}