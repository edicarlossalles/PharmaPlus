const API_URL = "http://localhost:8080";

async function logar() {
  const matriculaVal = document.getElementById("login").value.trim();
  const senha = document.getElementById("senha").value;

  const btn = document.querySelector(".btn-main");
  const msg = document.getElementById("msg-login");
  const matricula = parseInt(matriculaVal);
  if (!matriculaVal || isNaN(matricula) || matricula <= 0) {
    mostrarMsg(msg, "error", "Informe uma matrícula válida.");
    return;
  }

  if (!senha) {
    mostrarMsg(msg, "error", "Informe sua senha.");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Entrando...";

  try {
    const res = await fetch(`${API_URL}/usuarios/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ matricula, senha })
    });

    if (!res.ok && res.status !== 401) {
      mostrarMsg(msg, "error", "Erro no servidor. Tente novamente.");
      btn.disabled = false;
      btn.textContent = "Entrar";
      return;
    }

    const data = await res.json();

    if (data.sucesso) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role || "ATENDENTE");

      btn.textContent = "Redirecionando...";
      window.location.href = "home.html";
    } else {
      mostrarMsg(msg, "error", data.mensagem || "Login inválido.");
      btn.disabled = false;
      btn.textContent = "Entrar";
    }

  } catch (e) {
    mostrarMsg(msg, "error", "Erro ao conectar com o servidor.");
    btn.disabled = false;
    btn.textContent = "Entrar";
  }
}

function toggleSenhaLogin(btn) {
  const inp = document.getElementById("senha");
  if (inp.type === "password") {
    inp.type = "text";
    btn.textContent = "🙈";
  } else {
    inp.type = "password";
    btn.textContent = "👁";
  }
}

function mostrarMsg(el, tipo, texto) {
  el.className = `msg ${tipo}`;
  el.textContent = texto;
}

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (token) {
    window.location.href = "home.html";
    return;
  }

  ["login", "senha"].forEach(id => {
    document.getElementById(id).addEventListener("keydown", e => {
      if (e.key === "Enter") logar();
    });
  });
});