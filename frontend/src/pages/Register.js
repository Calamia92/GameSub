import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.password_confirm) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      if (err.response && err.response.data) {
        const errors = err.response.data;
        if (errors.username) {
          setError('Ce nom d\'utilisateur est déjà pris');
        } else if (errors.email) {
          setError('Cette adresse email est déjà utilisée');
        } else if (errors.password) {
          setError('Le mot de passe est trop faible');
        } else {
          setError('Erreur lors de l\'inscription');
        }
      } else {
        setError('Erreur lors de l\'inscription');
      }
      console.error('Register error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Inscription</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        {error && (
          <div className="error" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}
        
        <input
          type="text"
          name="username"
          placeholder="Nom d'utilisateur"
          value={formData.username}
          onChange={handleChange}
          required
        />
        
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        
        <input
          type="text"
          name="first_name"
          placeholder="Prénom"
          value={formData.first_name}
          onChange={handleChange}
        />
        
        <input
          type="text"
          name="last_name"
          placeholder="Nom"
          value={formData.last_name}
          onChange={handleChange}
        />
        
        <input
          type="password"
          name="password"
          placeholder="Mot de passe"
          value={formData.password}
          onChange={handleChange}
          required
        />
        
        <input
          type="password"
          name="password_confirm"
          placeholder="Confirmer le mot de passe"
          value={formData.password_confirm}
          onChange={handleChange}
          required
        />
        
        <button type="submit" disabled={loading}>
          {loading ? 'Inscription...' : 'S\'inscrire'}
        </button>
        
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;