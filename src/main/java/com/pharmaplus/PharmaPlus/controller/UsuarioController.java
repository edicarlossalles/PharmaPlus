package com.pharmaplus.PharmaPlus.controller;

import com.pharmaplus.PharmaPlus.model.Usuario;
import com.pharmaplus.PharmaPlus.repository.UsuarioRepository;
import com.pharmaplus.PharmaPlus.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/usuarios")
@CrossOrigin(origins = "*") // Permite requisições do frontend
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final JwtUtil jwtUtil;

    public UsuarioController(UsuarioRepository usuarioRepository, JwtUtil jwtUtil) {
        this.usuarioRepository = usuarioRepository;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/registro")
    public ResponseEntity<Map<String, Object>> salvarUsuario(@RequestBody Usuario usuario) {
        Usuario findUsuario = this.usuarioRepository.findByMatricula(usuario.getMatricula());

        if (findUsuario != null) {
            return ResponseEntity.ok(Map.of(
                "sucesso", false,
                "mensagem", "Matrícula já cadastrada!"
            ));
        }

        this.usuarioRepository.save(usuario);

        String token = jwtUtil.gerarToken(usuario.getMatricula());

        return ResponseEntity.ok(Map.of(
            "sucesso", true,
            "mensagem", "Usuário criado com sucesso!",
                "token", token
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Usuario usuario) {
        Usuario findUsuario = this.usuarioRepository.findByMatricula(usuario.getMatricula());

        if (findUsuario == null || !findUsuario.getSenha().equals(usuario.getSenha())) {
            return ResponseEntity.status(401).body(Map.of(
                "sucesso", false,
                "mensagem", "Matrícula ou senha incorreta!"
            ));
        }

        String token = jwtUtil.gerarToken(usuario.getMatricula());

        return ResponseEntity.ok(Map.of(
            "sucesso", true,
            "mensagem", "Login realizado com sucesso!",
                "token", token
        ));
    }
}
