package com.pharmaplus.PharmaPlus.controller;

import com.pharmaplus.PharmaPlus.model.Usuario;
import com.pharmaplus.PharmaPlus.repository.UsuarioRepository;
import com.pharmaplus.PharmaPlus.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder encoder;

    public UsuarioController(UsuarioRepository usuarioRepository,
                             JwtUtil jwtUtil,
                             BCryptPasswordEncoder encoder) {
        this.usuarioRepository = usuarioRepository;
        this.jwtUtil = jwtUtil;
        this.encoder = encoder;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, Object> body) {
        if (body == null || !body.containsKey("matricula")) {
            return ResponseEntity.badRequest()
                .body(Map.of("sucesso", false, "mensagem", "Matrícula inválida."));
        }

        int matricula;
        try {
            matricula = ((Number) body.get("matricula")).intValue();
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("sucesso", false, "mensagem", "Matrícula inválida."));
        }

        if (matricula == 0) {
            return ResponseEntity.badRequest()
                .body(Map.of("sucesso", false, "mensagem", "Matrícula inválida."));
        }

        String senha = (String) body.getOrDefault("senha", "");

        Usuario found = usuarioRepository.findByMatricula(matricula);

        if (found == null || !encoder.matches(senha, found.getSenha())) {
            return ResponseEntity.status(401)
                .header("Content-Type", "application/json")
                .body(Map.of("sucesso", false, "mensagem", "Matrícula ou senha incorreta."));
        }

        String token = jwtUtil.gerarToken(matricula);

        return ResponseEntity.ok(Map.of(
            "sucesso",  true,
            "mensagem", "Login realizado com sucesso!",
            "token",    token,
            "role",     found.getRole() != null ? found.getRole() : "ATENDENTE"
        ));
    }

    /* ══ GET /usuarios/listar ══ */
    @GetMapping("/listar")
    public ResponseEntity<?> listar() {
        List<Usuario> lista = usuarioRepository.findAll();
        lista.forEach(u -> u.setSenha(null));
        return ResponseEntity.ok(lista);
    }

    /* ══ POST /usuarios/cadastrar ══ */
    @PostMapping("/cadastrar")
    public ResponseEntity<Map<String, Object>> cadastrar(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of(
                    "sucesso",  false,
                    "mensagem", "Acesso não autorizado."
                ));
            }
            try {
                String  token        = authHeader.replace("Bearer ", "").trim();
                Integer matriculaReq = jwtUtil.pegarMatricula(token);
                Usuario solicitante  = usuarioRepository.findByMatricula(matriculaReq);
                if (solicitante == null || !"FARMACEUTICO".equals(solicitante.getRole())) {
                    return ResponseEntity.status(403).body(Map.of(
                        "sucesso",  false,
                        "mensagem", "Apenas um Farmacêutico pode cadastrar usuários."
                    ));
                }
            } catch (Exception e) {
                return ResponseEntity.status(401).body(Map.of(
                    "sucesso",  false,
                    "mensagem", "Token inválido ou expirado."
                ));
            }

            int    matricula = ((Number) body.get("matricula")).intValue();
            String senha     = (String) body.get("senha");
            String nome      = (String) body.getOrDefault("nome",  "");
            String cargo     = (String) body.getOrDefault("cargo", "");
            String email     = (String) body.getOrDefault("email", "");
            String role      = (String) body.getOrDefault("role",  "ATENDENTE");

            if (matricula == 0 || senha == null || senha.length() < 6) {
                return ResponseEntity.badRequest().body(Map.of(
                    "sucesso", false,
                    "mensagem", "Matrícula e senha (mín. 6 caracteres) são obrigatórios."
                ));
            }

            if (!"ATENDENTE".equals(role) && !"FARMACEUTICO".equals(role)) {
                return ResponseEntity.badRequest().body(Map.of(
                    "sucesso",  false,
                    "mensagem", "Papel inválido."
                ));
            }

            if (usuarioRepository.findByMatricula(matricula) != null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "sucesso", false,
                    "mensagem", "Matrícula já cadastrada."
                ));
            }

            Usuario novo = new Usuario();
            novo.setMatricula(matricula);
            novo.setSenha(encoder.encode(senha));
            novo.setNome(nome);
            novo.setCargo(cargo);
            novo.setEmail(email);
            novo.setRole(role);

            usuarioRepository.save(novo);

            return ResponseEntity.ok(Map.of("sucesso", true, "mensagem", "Usuário cadastrado com sucesso!"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "sucesso", false,
                "mensagem", "Erro ao cadastrar: " + e.getMessage()
            ));
        }
    }

    /* ══ PUT /usuarios/atualizar/{id} ══ */
    @PutMapping("/atualizar/{id}")
    public ResponseEntity<Map<String, Object>> atualizar(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        Usuario usuario = usuarioRepository.findById(id).orElse(null);
        if (usuario == null) {
            return ResponseEntity.status(404).body(Map.of(
                "sucesso", false, "mensagem", "Usuário não encontrado."
            ));
        }

        if (body.containsKey("nome"))  usuario.setNome((String) body.get("nome"));
        if (body.containsKey("cargo")) usuario.setCargo((String) body.get("cargo"));
        if (body.containsKey("email")) usuario.setEmail((String) body.get("email"));
        if (body.containsKey("role"))  usuario.setRole((String) body.get("role"));

        if (body.containsKey("novaSenha")) {
            String nova = (String) body.get("novaSenha");
            if (nova != null && nova.length() >= 6) {
                usuario.setSenha(encoder.encode(nova));
            }
        }

        usuarioRepository.save(usuario);
        return ResponseEntity.ok(Map.of("sucesso", true, "mensagem", "Usuário atualizado com sucesso!"));
    }

    /* ══ DELETE /usuarios/deletar/{id} ══ */
    @DeleteMapping("/deletar/{id}")
    public ResponseEntity<Map<String, Object>> deletar(@PathVariable Long id) {
        if (!usuarioRepository.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of(
                "sucesso", false, "mensagem", "Usuário não encontrado."
            ));
        }
        usuarioRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("sucesso", true, "mensagem", "Usuário removido."));
    }
}
