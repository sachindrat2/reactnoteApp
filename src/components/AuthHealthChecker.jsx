import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { notesAPI } from '../services/api.js';

const AuthHealthChecker = () => {
  // Completely disable in production - return null immediately
  return null;
};

export default AuthHealthChecker;