package com.smartshop.security;

import com.smartshop.entity.user.User;
import com.smartshop.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Try to find by username first
        User user = userRepository.findByUsername(username).orElse(null);
        
        // If not found by username, try to find by email
        if (user == null) {
            user = userRepository.findByEmail(username).orElse(null);
        }
        
        // If still not found, throw exception
        if (user == null) {
            throw new UsernameNotFoundException("User not found with username or email: " + username);
        }

        return user;
    }

    @Transactional
    public UserDetails loadUserByEmail(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        return user;
    }
}

