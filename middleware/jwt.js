const jwt = require('jsonwebtoken');

exports.middlewareJWT = (req, res, next) => {
     try {
   
    let token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token no encontrado' });
    }

    jwt.verify(token, process.env.SECRET_JWT_KEY, (error, decode) => {
      if (error) {
        return res.status(401).json({ msj: 'Error al verificar token', detalle: error.message });
      }
      req.decode = decode;
      next();
    });
  } catch (error) {
    res.status(500).json({ msj: 'Error en middlewareJWT', detalle: error.message });
  }
}