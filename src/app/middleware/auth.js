// middleware/auth.js
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const authMiddleware = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    const token = authHeader.substring(7); // Remover 'Bearer '

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Obtener información adicional del usuario
    const result = await pool.query(`
      SELECT p.id, p.username, p.full_name, p.email, p.id_perfil, 
             pe.perfil, p.status
      FROM profiles p
      JOIN perfiles pe ON p.id_perfil = pe.id_perfil
      WHERE p.id = $1 AND p.status = 1
    `, [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
    }

    const user = result.rows[0];

    // Agregar información del usuario al request
    req.user = {
      userId: user.id,
      username: user.username,
      fullName: user.full_name,
      email: user.email,
      userProfile: user.id_perfil,
      profileName: user.perfil
    };

    next();
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = authMiddleware;