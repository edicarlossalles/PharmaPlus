package com.pharmaplus.PharmaPlus.controller;

import com.pharmaplus.PharmaPlus.model.Usuario;
import com.pharmaplus.PharmaPlus.repository.UsuarioRepository;
import com.pharmaplus.PharmaPlus.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final JwtUtil jwtUtil;

    public UsuarioController(UsuarioRepository usuarioRepository, JwtUtil jwtUtil) {
        this.usuarioRepository = usuarioRepository;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Usuario usuario) {
        Usuario findUsuario = usuarioRepository.findByMatricula(usuario.getMatricula());

        if (findUsuario == null || !findUsuario.getSenha().equals(usuario.getSenha())) {
            return ResponseEntity.status(401).body(Map.of(
                "sucesso",  false,
                "mensagem", "Matrícula ou senha incorreta."
            ));
        }

        String token = jwtUtil.gerarToken(usuario.getMatricula());

        return ResponseEntity.ok(Map.of(
            "sucesso",  true,
            "mensagem", "Login realizado com sucesso!",
            "token",    token
        ));
    }

    @PostMapping("/verificar-matricula")
    public ResponseEntity<Map<String, Object>> verificarMatricula(@RequestBody Map<String, Object> body) {
        int matricula = (int) body.get("matricula");

        Usuario usuario = usuarioRepository.findByMatricula(matricula);

        if (usuario == null) {
            return ResponseEntity.ok(Map.of(
                "sucesso",  false,
                "mensagem", "Matrícula não encontrada no sistema."
            ));
        }

        if (usuario.getEmail() == null || usuario.getEmail().isBlank()) {
            return ResponseEntity.ok(Map.of(
                "sucesso",  false,
                "mensagem", "Esta conta não possui e-mail cadastrado. Contate o administrador."
            ));
        }

        return ResponseEntity.ok(Map.of(
            "sucesso",  true,
            "mensagem", "Matrícula encontrada.",
            "email",    usuario.getEmail(),
            "nome",     usuario.getNome() != null ? usuario.getNome() : "Usuário"
        ));
    }

    @PostMapping("/redefinir-senha")
    public ResponseEntity<Map<String, Object>> redefinirSenha(@RequestBody Map<String, Object> body) {
        int matricula    = (int) body.get("matricula");
        String novaSenha = (String) body.get("novaSenha");

        if (novaSenha == null || novaSenha.length() < 6) {
            return ResponseEntity.ok(Map.of(
                "sucesso",  false,
                "mensagem", "A nova senha deve ter pelo menos 6 caracteres."
            ));
        }

        Usuario usuario = usuarioRepository.findByMatricula(matricula);

        if (usuario == null) {
            return ResponseEntity.status(404).body(Map.of(
                "sucesso",  false,
                "mensagem", "Matrícula não encontrada."
            ));
        }

        usuario.setSenha(novaSenha);
        usuarioRepository.save(usuario);

        return ResponseEntity.ok(Map.of(
            "sucesso",  true,
            "mensagem", "Senha redefinida com sucesso!"
        ));
    }
}
