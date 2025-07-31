// routes/postulaciones.js
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const authMiddleware = require('../middleware/auth');
const { validationResult, body, param, query } = require('express-validator');

// Configuración de la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// =============================================
// ENDPOINTS PARA CANDIDATOS
// =============================================

// Obtener empleos públicos
router.get('/empleos-publicos', [
  query('categoria').optional().isString(),
  query('modalidad').optional().isString(),
  query('experiencia').optional().isString(),
  query('busqueda').optional().isString(),
  query('limite').optional().isInt({ min: 1, max: 50 }),
  query('pagina').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { categoria, modalidad, experiencia, busqueda, limite = 12, pagina = 1 } = req.query;
    const offset = (pagina - 1) * limite;

    // Construir consulta dinámica
    let whereConditions = [
      'e.status = 1',
      'e.fecha_fin_publicacion > NOW()',
      'emp.status = 1'
    ];
    let params = [];
    let paramIndex = 1;

    if (categoria) {
      whereConditions.push(`e.categoria = $${paramIndex}`);
      params.push(categoria);
      paramIndex++;
    }

    if (modalidad) {
      whereConditions.push(`e.lugar_trabajo->'modalidades' @> $${paramIndex}`);
      params.push(JSON.stringify([modalidad]));
      paramIndex++;
    }

    if (experiencia) {
      whereConditions.push(`e.experiencia_laboral = $${paramIndex}`);
      params.push(experiencia);
      paramIndex++;
    }

    if (busqueda) {
      whereConditions.push(`(e.nombre ILIKE $${paramIndex} OR emp.nombre ILIKE $${paramIndex} OR e.categoria ILIKE $${paramIndex})`);
      params.push(`%${busqueda}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Consulta principal
    const empleosQuery = `
      SELECT 
        e.id,
        e.nombre,
        emp.nombre as empresa_nombre,
        e.categoria,
        e.lugar_trabajo,
        e.experiencia_laboral,
        e.salario,
        e.jornada_laboral,
        e.fecha_creacion,
        e.urgencia,
        e.numero_vacantes,
        e.descripcion,
        EXTRACT(DAYS FROM (e.fecha_fin_publicacion - NOW()))::INT as dias_restantes
      FROM empleos e
      JOIN empresas emp ON e.empresa_id = emp.id
      WHERE ${whereClause}
      ORDER BY 
        CASE WHEN e.urgencia = 'urgente' THEN 1 ELSE 2 END,
        e.fecha_creacion DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limite, offset);

    // Consulta de conteo
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM empleos e
      JOIN empresas emp ON e.empresa_id = emp.id
      WHERE ${whereClause}
    `;

    const [empleosResult, countResult] = await Promise.all([
      pool.query(empleosQuery, params),
      pool.query(countQuery, params.slice(0, -2)) // Sin limit y offset
    ]);

    res.json({
      empleos: empleosResult.rows,
      total: parseInt(countResult.rows[0].total),
      pagina: parseInt(pagina),
      limite: parseInt(limite)
    });
  } catch (error) {
    console.error('Error al obtener empleos públicos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener detalle de un empleo
router.get('/empleos/:id/detalle', [
  param('id').isInt()
], async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT e.*, emp.nombre as empresa_nombre, emp.descripcion as empresa_descripcion,
             emp.sector, emp.tamano_empresa, emp.sitio_web
      FROM empleos e
      JOIN empresas emp ON e.empresa_id = emp.id
      WHERE e.id = $1 AND e.status = 1 AND e.fecha_fin_publicacion > NOW()
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Empleo no encontrado' });
    }

    // Incrementar vistas
    await pool.query('UPDATE empleos SET vistas = COALESCE(vistas, 0) + 1 WHERE id = $1', [id]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener detalle del empleo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener CVs del usuario autenticado
router.get('/mis-cvs', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    
    const result = await pool.query(
      'SELECT * FROM get_cvs_candidato($1)',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener CVs:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Aplicar a un empleo
router.post('/aplicar', authMiddleware, [
  body('empleo_id').isInt(),
  body('cv_id').isInt(),
  body('carta_presentacion').notEmpty().trim(),
  body('salario_esperado').optional().isNumeric(),
  body('disponibilidad_inicio').optional().isDate(),
  body('notas_candidato').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.user;
    const { 
      empleo_id, 
      cv_id, 
      carta_presentacion, 
      salario_esperado, 
      disponibilidad_inicio, 
      notas_candidato 
    } = req.body;

    const result = await pool.query(
      'SELECT aplicar_a_empleo($1, $2, $3, $4, $5, $6, $7)',
      [empleo_id, userId, cv_id, carta_presentacion, salario_esperado, disponibilidad_inicio, notas_candidato]
    );

    const response = result.rows[0].aplicar_a_empleo;
    
    if (response.success) {
      res.status(201).json(response);
    } else {
      res.status(400).json(response);
    }
  } catch (error) {
    console.error('Error al aplicar a empleo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener mis aplicaciones
router.get('/mis-aplicaciones', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    
    const result = await pool.query(`
      SELECT * FROM v_aplicaciones_completa 
      WHERE candidato_id = $1 
      ORDER BY fecha_aplicacion DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener aplicaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Retirar aplicación
router.delete('/aplicaciones/:id', authMiddleware, [
  param('id').isInt()
], async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    // Verificar que la aplicación pertenece al usuario y puede ser retirada
    const checkResult = await pool.query(`
      SELECT status FROM aplicaciones_empleo 
      WHERE id = $1 AND candidato_id = $2
    `, [id, userId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Aplicación no encontrada' });
    }

    const status = checkResult.rows[0].status;
    if (!['pendiente', 'revisado'].includes(status)) {
      return res.status(400).json({ 
        error: 'No se puede retirar una aplicación en estado: ' + status 
      });
    }

    // Eliminar aplicación
    await pool.query('DELETE FROM aplicaciones_empleo WHERE id = $1', [id]);

    res.json({ success: true, message: 'Aplicación retirada exitosamente' });
  } catch (error) {
    console.error('Error al retirar aplicación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// ENDPOINTS PARA RRHH/EMPRESAS
// =============================================

// Obtener aplicaciones por empresa
router.get('/aplicaciones-empresa', authMiddleware, [
  query('empleo_id').optional().isInt(),
  query('status').optional().isString(),
  query('fecha_desde').optional().isDate(),
  query('fecha_hasta').optional().isDate()
], async (req, res) => {
  try {
    const { userId, userProfile } = req.user;
    const { empleo_id, status, fecha_desde, fecha_hasta } = req.query;

    let whereClause = '';
    let params = [userId, userProfile];
    let paramCount = 2;

    // Construcción dinámica de filtros
    if (empleo_id) {
      whereClause += ` AND a.empleo_id = $${++paramCount}`;
      params.push(empleo_id);
    }

    if (status) {
      whereClause += ` AND a.status = $${++paramCount}`;
      params.push(status);
    }

    if (fecha_desde) {
      whereClause += ` AND a.fecha_aplicacion >= $${++paramCount}`;
      params.push(fecha_desde);
    }

    if (fecha_hasta) {
      whereClause += ` AND a.fecha_aplicacion <= $${++paramCount}`;
      params.push(fecha_hasta + ' 23:59:59');
    }

    const query = `
      SELECT a.*, 
             c.full_name as candidato_nombre,
             c.email as candidato_email,
             c.phone as candidato_telefono,
             c.profile_picture as candidato_foto,
             e.nombre as empleo_nombre,
             emp.nombre as empresa_nombre,
             cv.nombre as cv_nombre,
             EXTRACT(DAYS FROM (NOW() - a.fecha_aplicacion)) as dias_desde_aplicacion,
             CASE 
               WHEN a.status = 'pendiente' THEN 'Pendiente de revisión'
               WHEN a.status = 'revisado' THEN 'Revisado por RRHH'
               WHEN a.status = 'preseleccionado' THEN 'Preseleccionado'
               WHEN a.status = 'entrevista' THEN 'En proceso de entrevista'
               WHEN a.status = 'rechazado' THEN 'No seleccionado'
               WHEN a.status = 'contratado' THEN 'Contratado'
               ELSE a.status
             END as status_descripcion
      FROM aplicaciones_empleo a
      JOIN empleos e ON a.empleo_id = e.id
      JOIN empresas emp ON e.empresa_id = emp.id
      JOIN profiles c ON a.candidato_id = c.id
      LEFT JOIN cv ON a.cv_id = cv.id
      WHERE (
        $2 = 1 OR  -- Admin ve todo
        ($2 = 3 AND $1 = ANY(emp.responsables))  -- Supervisor ve solo su empresa
      ) ${whereClause}
      ORDER BY a.fecha_aplicacion DESC
    `;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener aplicaciones de empresa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener detalle completo de una aplicación
router.get('/aplicaciones/:id/detalle', authMiddleware, [
  param('id').isInt()
], async (req, res) => {
  try {
    const { userId, userProfile } = req.user;
    const { id } = req.params;

    const result = await pool.query(`
      SELECT a.*, 
             c.full_name as candidato_nombre,
             c.email as candidato_email,
             c.phone as candidato_telefono,
             c.profile_picture as candidato_foto,
             e.nombre as empleo_nombre,
             e.categoria as empleo_categoria,
             emp.nombre as empresa_nombre,
             cv.nombre as cv_nombre,
             cv.educacion as cv_educacion,
             cv.experiencia_laboral as cv_experiencia,
             cv.idiomas as cv_idiomas,
             cv.cursos_certificaciones_extra as cv_cursos,
             cv.contactos_referencias as cv_referencias,
             cv.updated_at as cv_fecha_actualizacion,
             CASE 
               WHEN a.status = 'pendiente' THEN 'Pendiente de revisión'
               WHEN a.status = 'revisado' THEN 'Revisado por RRHH'
               WHEN a.status = 'preseleccionado' THEN 'Preseleccionado'
               WHEN a.status = 'entrevista' THEN 'En proceso de entrevista'
               WHEN a.status = 'rechazado' THEN 'No seleccionado'
               WHEN a.status = 'contratado' THEN 'Contratado'
               ELSE a.status
             END as status_descripcion,
             EXTRACT(DAYS FROM (NOW() - a.fecha_aplicacion)) as dias_desde_aplicacion
      FROM aplicaciones_empleo a
      JOIN empleos e ON a.empleo_id = e.id
      JOIN empresas emp ON e.empresa_id = emp.id
      JOIN profiles c ON a.candidato_id = c.id
      LEFT JOIN cv ON a.cv_id = cv.id
      WHERE a.id = $1
      AND (
        $3 = 1 OR  -- Admin ve todo
        ($3 = 3 AND $2 = ANY(emp.responsables))  -- Supervisor ve solo su empresa
      )
    `, [id, userId, userProfile]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aplicación no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener detalle de aplicación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar estado de aplicación
router.put('/aplicaciones/:id/estado', authMiddleware, [
  param('id').isInt(),
  body('status').notEmpty().isIn(['pendiente', 'revisado', 'preseleccionado', 'entrevista', 'rechazado', 'contratado']),
  body('notas_rrhh').optional().isString(),
  body('puntuacion_rrhh').optional().isInt({ min: 1, max: 10 }),
  body('comentario').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.user;
    const { id } = req.params;
    const { status, notas_rrhh, puntuacion_rrhh, comentario } = req.body;

    const result = await pool.query(
      'SELECT actualizar_estado_aplicacion($1, $2, $3, $4, $5, $6)',
      [id, status, notas_rrhh, puntuacion_rrhh, comentario, userId]
    );

    const response = result.rows[0].actualizar_estado_aplicacion;
    
    if (response.success) {
      res.json(response);
    } else {
      res.status(400).json(response);
    }
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// ENDPOINTS PARA ENTREVISTAS
// =============================================

// Programar entrevista
router.post('/entrevistas', authMiddleware, [
  body('aplicacion_id').isInt(),
  body('fecha_entrevista').isISO8601(),
  body('tipo_entrevista').isIn(['presencial', 'virtual', 'telefonica']),
  body('entrevistador_id').isInt(),
  body('lugar_direccion').optional().isString(),
  body('enlace_virtual').optional().isURL(),
  body('duracion_estimada').optional().isInt({ min: 15, max: 480 }),
  body('notas_preparacion').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      aplicacion_id,
      fecha_entrevista,
      tipo_entrevista,
      entrevistador_id,
      lugar_direccion,
      enlace_virtual,
      duracion_estimada = 60,
      notas_preparacion
    } = req.body;

    const result = await pool.query(
      'SELECT programar_entrevista($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        aplicacion_id,
        fecha_entrevista,
        tipo_entrevista,
        entrevistador_id,
        lugar_direccion,
        enlace_virtual,
        duracion_estimada,
        notas_preparacion
      ]
    );

    const response = result.rows[0].programar_entrevista;
    
    if (response.success) {
      res.status(201).json(response);
    } else {
      res.status(400).json(response);
    }
  } catch (error) {
    console.error('Error al programar entrevista:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener entrevistas
router.get('/entrevistas', authMiddleware, [
  query('fecha_desde').optional().isDate(),
  query('fecha_hasta').optional().isDate(),
  query('entrevistador_id').optional().isInt(),
  query('tipo').optional().isString()
], async (req, res) => {
  try {
    const { userId, userProfile } = req.user;
    const { fecha_desde, fecha_hasta, entrevistador_id, tipo } = req.query;

    let whereClause = '';
    let params = [userId, userProfile];
    let paramCount = 2;

    if (fecha_desde) {
      whereClause += ` AND ent.fecha_entrevista >= $${++paramCount}`;
      params.push(fecha_desde);
    }

    if (fecha_hasta) {
      whereClause += ` AND ent.fecha_entrevista <= $${++paramCount}`;
      params.push(fecha_hasta + ' 23:59:59');
    }

    if (entrevistador_id) {
      whereClause += ` AND ent.entrevistador_id = $${++paramCount}`;
      params.push(entrevistador_id);
    }

    if (tipo) {
      whereClause += ` AND ent.tipo_entrevista = $${++paramCount}`;
      params.push(tipo);
    }

    const query = `
      SELECT ent.*, 
             a.candidato_id,
             c.full_name as candidato_nombre,
             e.nombre as empleo_nombre,
             emp.nombre as empresa_nombre,
             entrevistador.full_name as entrevistador_nombre
      FROM entrevistas ent
      JOIN aplicaciones_empleo a ON ent.aplicacion_id = a.id
      JOIN empleos e ON a.empleo_id = e.id
      JOIN empresas emp ON e.empresa_id = emp.id
      JOIN profiles c ON a.candidato_id = c.id
      JOIN profiles entrevistador ON ent.entrevistador_id = entrevistador.id
      WHERE (
        $2 = 1 OR  -- Admin ve todo
        ($2 = 3 AND $1 = ANY(emp.responsables)) OR  -- Supervisor ve su empresa
        ent.entrevistador_id = $1  -- Entrevistador ve sus entrevistas
      ) ${whereClause}
      ORDER BY ent.fecha_entrevista ASC
    `;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener entrevistas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar resultado de entrevista
router.put('/entrevistas/:id', authMiddleware, [
  param('id').isInt(),
  body('puntuacion_entrevista').optional().isInt({ min: 1, max: 10 }),
  body('notas_entrevista').optional().isString(),
  body('recomendacion').optional().isIn(['contratar', 'no_contratar', 'segunda_entrevista']),
  body('realizada').optional().isBoolean()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { puntuacion_entrevista, notas_entrevista, recomendacion, realizada } = req.body;

    const result = await pool.query(`
      UPDATE entrevistas 
      SET puntuacion_entrevista = COALESCE($2, puntuacion_entrevista),
          notas_entrevista = COALESCE($3, notas_entrevista),
          recomendacion = COALESCE($4, recomendacion),
          realizada = COALESCE($5, realizada),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id, puntuacion_entrevista, notas_entrevista, recomendacion, realizada]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entrevista no encontrada' });
    }

    res.json({ 
      success: true, 
      message: 'Entrevista actualizada exitosamente',
      entrevista: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar entrevista:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// ENDPOINTS PARA NOTIFICACIONES
// =============================================

// Obtener notificaciones del usuario
router.get('/notificaciones', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    
    const result = await pool.query(`
      SELECT * FROM notificaciones 
      WHERE destinatario_id = $1 
      ORDER BY fecha_creacion DESC 
      LIMIT 50
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Marcar notificación como leída
router.put('/notificaciones/:id/leer', authMiddleware, [
  param('id').isInt()
], async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    await pool.query(`
      UPDATE notificaciones 
      SET leida = true, fecha_lectura = NOW() 
      WHERE id = $1 AND destinatario_id = $2
    `, [id, userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Marcar todas las notificaciones como leídas
router.put('/notificaciones/marcar-todas-leidas', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;

    await pool.query(`
      UPDATE notificaciones 
      SET leida = true, fecha_lectura = NOW() 
      WHERE destinatario_id = $1 AND leida = false
    `, [userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error al marcar notificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// ENDPOINTS PARA CVs
// =============================================

// Generar PDF del CV
router.get('/cvs/:id/generar-pdf', authMiddleware, [
  param('id').isInt()
], async (req, res) => {
  try {
    const { userId, userProfile } = req.user;
    const { id } = req.params;

    // Verificar permisos
    const cvResult = await pool.query(`
      SELECT cv.*, c.full_name as candidato_nombre
      FROM cv cv
      JOIN profiles c ON cv.id_profile = c.id
      WHERE cv.id = $1
      AND (
        cv.id_profile = $2 OR  -- El candidato puede ver su propio CV
        $3 IN (1, 3) OR  -- Admin o Supervisor pueden ver CVs
        EXISTS (  -- RRHH puede ver CVs de aplicaciones a sus empleos
          SELECT 1 FROM aplicaciones_empleo a
          JOIN empleos e ON a.empleo_id = e.id
          JOIN empresas emp ON e.empresa_id = emp.id
          WHERE a.cv_id = cv.id
          AND $2 = ANY(emp.responsables)
        )
      )
    `, [id, userId, userProfile]);

    if (cvResult.rows.length === 0) {
      return res.status(404).json({ error: 'CV no encontrado o sin permisos' });
    }

    // Aquí iría la lógica para generar el PDF
    // Por ahora, retornamos una URL de ejemplo
    const pdfUrl = `/api/cvs/${id}/pdf/${Date.now()}.pdf`;
    
    res.json({ 
      success: true, 
      url: pdfUrl,
      message: 'PDF generado exitosamente' 
    });
  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// ENDPOINTS PARA ESTADÍSTICAS
// =============================================

// Dashboard de estadísticas
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const { userId, userProfile } = req.user;
    
    let stats = {};

    if (userProfile === 2) { // Usuario candidato
      const candidatoStats = await pool.query(`
        SELECT 
          COUNT(*) as total_aplicaciones,
          COUNT(CASE WHEN status = 'pendiente' THEN 1 END) as aplicaciones_pendientes,
          COUNT(CASE WHEN status = 'revisado' THEN 1 END) as aplicaciones_revisadas,
          COUNT(CASE WHEN status = 'preseleccionado' THEN 1 END) as preseleccionado,
          COUNT(CASE WHEN status = 'entrevista' THEN 1 END) as entrevistas,
          COUNT(CASE WHEN status = 'contratado' THEN 1 END) as contrataciones,
          COUNT(CASE WHEN status = 'rechazado' THEN 1 END) as rechazadas
        FROM aplicaciones_empleo 
        WHERE candidato_id = $1
      `, [userId]);

      const empleosDisponibles = await pool.query(`
        SELECT COUNT(*) as empleos_disponibles
        FROM empleos e 
        JOIN empresas emp ON e.empresa_id = emp.id
        WHERE e.status = 1 
        AND e.fecha_fin_publicacion > NOW()
        AND emp.status = 1
      `);

      stats = {
        ...candidatoStats.rows[0],
        empleos_disponibles: parseInt(empleosDisponibles.rows[0].empleos_disponibles)
      };

    } else if ([1, 3].includes(userProfile)) { // Admin o Supervisor
      const empresaStats = await pool.query(`
        SELECT 
          COUNT(CASE WHEN e.status = 1 AND e.fecha_fin_publicacion > NOW() THEN 1 END) as empleos_activos,
          COALESCE(SUM(e.aplicaciones_recibidas), 0) as total_aplicaciones,
          COUNT(CASE WHEN a.status = 'pendiente' THEN 1 END) as aplicaciones_pendientes,
          COUNT(CASE WHEN a.status = 'preseleccionado' THEN 1 END) as candidatos_preseleccionados
        FROM empleos e
        LEFT JOIN aplicaciones_empleo a ON e.id = a.empleo_id
        LEFT JOIN empresas emp ON e.empresa_id = emp.id
        WHERE (
          $2 = 1 OR  -- Admin ve todo
          ($2 = 3 AND $1 = ANY(emp.responsables))  -- Supervisor ve su empresa
        )
      `, [userId, userProfile]);

      const entrevistasStats = await pool.query(`
        SELECT COUNT(*) as entrevistas_programadas
        FROM entrevistas ent
        JOIN aplicaciones_empleo a ON ent.aplicacion_id = a.id
        JOIN empleos e ON a.empleo_id = e.id
        JOIN empresas emp ON e.empresa_id = emp.id
        WHERE ent.fecha_entrevista > NOW()
        AND (
          $2 = 1 OR  -- Admin ve todo
          ($2 = 3 AND $1 = ANY(emp.responsables))  -- Supervisor ve su empresa
        )
      `, [userId, userProfile]);

      stats = {
        ...empresaStats.rows[0],
        entrevistas_programadas: parseInt(entrevistasStats.rows[0].entrevistas_programadas)
      };
    }

    res.json(stats);
  } catch (error) {
    console.error('Error al obtener dashboard:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Estadísticas de un empleo específico
router.get('/empleos/:id/estadisticas', authMiddleware, [
  param('id').isInt()
], async (req, res) => {
  try {
    const { userId, userProfile } = req.user;
    const { id } = req.params;

    const result = await pool.query(`
      SELECT * FROM v_stats_aplicaciones_empleo 
      WHERE empleo_id = $1
      AND EXISTS (
        SELECT 1 FROM empleos e
        JOIN empresas emp ON e.empresa_id = emp.id
        WHERE e.id = $1
        AND (
          $3 = 1 OR  -- Admin ve todo
          ($3 = 3 AND $2 = ANY(emp.responsables))  -- Supervisor ve su empresa
        )
      )
    `, [id, userId, userProfile]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Estadísticas no encontradas o sin permisos' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// ENDPOINTS PARA EMPLEOS (INFORMACIÓN ADICIONAL)
// =============================================

// Obtener empleos de la empresa (para filtros)
router.get('/empleos-empresa', authMiddleware, async (req, res) => {
  try {
    const { userId, userProfile } = req.user;

    const result = await pool.query(`
      SELECT e.id, e.nombre, COUNT(a.id) as total_aplicaciones
      FROM empleos e
      JOIN empresas emp ON e.empresa_id = emp.id
      LEFT JOIN aplicaciones_empleo a ON e.id = a.empleo_id
      WHERE (
        $2 = 1 OR  -- Admin ve todo
        ($2 = 3 AND $1 = ANY(emp.responsables))  -- Supervisor ve su empresa
      )
      GROUP BY e.id, e.nombre
      ORDER BY e.fecha_creacion DESC
    `, [userId, userProfile]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener empleos de empresa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener usuarios entrevistadores
router.get('/entrevistadores', authMiddleware, async (req, res) => {
  try {
    const { userProfile } = req.user;

    // Solo admin y supervisores pueden ver entrevistadores
    if (![1, 3].includes(userProfile)) {
      return res.status(403).json({ error: 'Sin permisos para ver entrevistadores' });
    }

    const result = await pool.query(`
      SELECT p.id, p.full_name, p.email
      FROM profiles p
      JOIN perfiles pe ON p.id_perfil = pe.id_perfil
      WHERE p.status = 1 
      AND pe.perfil IN ('Administrador', 'Supervisor')
      ORDER BY p.full_name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener entrevistadores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// MIDDLEWARE DE MANEJO DE ERRORES
// =============================================

// Middleware para manejar errores de validación
router.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON malformado' });
  }
  next(error);
});

// Middleware para manejar errores de base de datos
router.use((error, req, res, next) => {
  console.error('Error en ruta de postulaciones:', error);
  
  // Errores de PostgreSQL
  if (error.code) {
    switch (error.code) {
      case '23505': // Violación de constraint único
        return res.status(409).json({ error: 'Ya existe un registro con esos datos' });
      case '23503': // Violación de foreign key
        return res.status(400).json({ error: 'Referencia inválida a otro registro' });
      case '23514': // Violación de check constraint
        return res.status(400).json({ error: 'Datos no válidos según las reglas de negocio' });
      default:
        return res.status(500).json({ error: 'Error de base de datos' });
    }
  }
  
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = router;