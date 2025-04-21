package com.example.myProject;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MyProjectApplication {

	public static void main(String[] args) {
		Dotenv dotenv = Dotenv.configure()
                .directory("C:/Users/007/Documents/myProject/backend")
                .filename(".env")
                .ignoreIfMalformed()
                .ignoreIfMissing()
                .load();
			
				
		System.setProperty("DB_URL", dotenv.get("DB_URL"));
		System.setProperty("DB_USER", dotenv.get("DB_USER"));
		System.setProperty("DB_PASSWORD", dotenv.get("DB_PASSWORD"));
		
		SpringApplication.run(MyProjectApplication.class, args);
	}
}
