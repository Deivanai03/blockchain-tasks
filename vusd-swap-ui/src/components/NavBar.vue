<template>
    <nav>
      <router-link to="/">Home</router-link>
      <router-link to="/node-info">Node Info</router-link>
      <router-link to="/deposit">Deposit</router-link>
      <router-link to="/swap">Swap</router-link>
      <router-link to="/withdraw">Withdraw</router-link>
    </nav>
  </template>
  
  <style scoped>
  nav {
    display: flex;
    gap: 15px;
    justify-content: center;
    padding: 10px;
    background: #41a39b;
  }
  
  nav a {
  color: black; 
  text-decoration: none; 
  font-weight: bold; 
  padding: 8px 12px; 
  border-radius: 5px; 
  transition: background 0.3s ease; 
}

nav a:hover {
  background: rgba(0, 0, 0, 0.1); 
}
  </style>
  