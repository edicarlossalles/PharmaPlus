package com.pharmaplus.PharmaPlus.controller;

import com.pharmaplus.PharmaPlus.model.Usuario;
import com.pharmaplus.PharmaPlus.repository.UsuarioRepository;
import com.pharmaplus.PharmaPlus.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/home")
@CrossOrigin(origins = "*")
public class UsuarioHomeController {

    private final UsuarioRepository usuarioRepository;
    private final JwtUtil jwtUtil;

    public UsuarioHomeController(UsuarioRepository usuarioRepository, JwtUtil jwtUtil) {
        this.usuarioRepository = usuarioRepository;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getUsuario(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of(
                    "sucesso", false,
                    "mensagem", "Token não informado ou formato inválido."
            ));
        }

        try {
            String token = authHeader.replace("Bearer ", "").trim();
            Integer matricula = jwtUtil.pegarMatricula(token);
            Usuario usuario = usuarioRepository.findByMatricula(matricula);

            if (usuario == null) {
                return ResponseEntity.status(401).body(Map.of(
                        "sucesso", false,
                        "mensagem", "Usuário não encontrado."
                ));
            }

            usuario.setSenha(null);
            return ResponseEntity.ok(usuario);

        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of(
                    "sucesso", false,
                    "mensagem", "Token inválido ou expirado."
            ));
        }
    }
}
