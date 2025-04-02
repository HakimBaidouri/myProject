package com.example.myProject.controller;

import com.example.myProject.model.User;
import com.example.myProject.repository.UserRepository;
import com.example.myProject.dto.UserRequestDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import jakarta.validation.Valid;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/myProject/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<User> createUser(@Valid @RequestBody UserRequestDTO userRequestDTO) {
        // Créer un nouvel utilisateur à partir du DTO
        User user = new User();
        user.setEmail(userRequestDTO.getEmail());
        user.setPassword(userRequestDTO.getPassword());
        user.setCompanyId(userRequestDTO.getCompanyId());
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        // Sauvegarder l'utilisateur dans la base de données
        User savedUser = userRepository.save(user);

        // Retourner une réponse HTTP avec l'utilisateur créé
        return new ResponseEntity<>(savedUser, HttpStatus.CREATED);
    }
}

