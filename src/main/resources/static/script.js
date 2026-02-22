const API_URL = "http://localhost:8080";

async function logar() {
    const matricula = document.getElementById("login").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!matricula || !senha) {
        mostrarErro("Preencha todos os campos!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/usuarios/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ matricula: parseInt(matricula), senha: senha })
        });

        if (response.ok) {
            window.location.href = "home.html";
        } else {
            mostrarErro("Matrícula ou senha incorreta!");
        }
    } catch (error) {
        mostrarErro("Não foi possível conectar ao servidor. Verifique se o backend está rodando.");
        console.error(error);
    }
}

async function registrar() {
    const matricula = document.getElementById("reg-matricula").value.trim();
    const senha = document.getElementById("reg-senha").value.trim();

    if (!matricula || !senha) {
        mostrarErroModal("Preencha todos os campos!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/usuarios/registro`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ matricula: parseInt(matricula), senha: senha })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.sucesso) {
                fecharModal();
                mostrarSucesso("Conta criada com sucesso! Faça o login.");
            } else {
                mostrarErroModal(data.mensagem || "Matrícula já cadastrada!");
            }
        } else {
            mostrarErroModal("Erro ao criar conta. Tente novamente.");
        }
    } catch (error) {
        mostrarErroModal("Não foi possível conectar ao servidor.");
        console.error(error);
    }
}

function abrirModal() {
    document.getElementById("modal-registro").style.display = "flex";
}

function fecharModal() {
    document.getElementById("modal-registro").style.display = "none";
    document.getElementById("reg-matricula").value = "";
    document.getElementById("reg-senha").value = "";
    limparErroModal();
}

function mostrarErro(msg) {
    const el = document.getElementById("erro-login");
    el.textContent = msg;
    el.style.display = "block";
}

function mostrarSucesso(msg) {
    const el = document.getElementById("erro-login");
    el.textContent = msg;
    el.style.color = "#2e7d32";
    el.style.display = "block";
}

function mostrarErroModal(msg) {
    const el = document.getElementById("erro-modal");
    el.textContent = msg;
    el.style.display = "block";
}

function limparErroModal() {
    const el = document.getElementById("erro-modal");
    el.textContent = "";
    el.style.display = "none";
}

// Fecha modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById("modal-registro");
    if (event.target === modal) fecharModal();
}
