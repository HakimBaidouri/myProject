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
import java.util.Optional;

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

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        Optional<User> user = userRepository.findById(id);
        if (user.isPresent()) {
            return new ResponseEntity<>(user.get(), HttpStatus.OK);
        }

        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
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

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @Valid @RequestBody UserRequestDTO userRequestDTO) {
        User existingUser = userRepository.findById(id).orElse(null);

        if (existingUser == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        existingUser.setEmail(userRequestDTO.getEmail());
        existingUser.setPassword(userRequestDTO.getPassword());
        existingUser.setCompanyId(userRequestDTO.getCompanyId());
        existingUser.setUpdatedAt(LocalDateTime.now());

        User updatedUser = userRepository.save(existingUser);

        return new ResponseEntity<>(updatedUser, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<User> deleteUser(@PathVariable Long id){
        User existingUser = userRepository.findById(id).orElse(null);

        if (existingUser == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        userRepository.delete(existingUser);

        return new ResponseEntity<>(HttpStatus.OK);
    }
}

