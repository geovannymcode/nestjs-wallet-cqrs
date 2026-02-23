import express from 'express';

const router = express.Router();
declare const db: any;

router.post('/disbursements', async (req, res) => {
  try {
    // Validación manual
    if (!req.body.amount || req.body.amount < 100) {
      return res.status(400).json({ error: 'Monto inválido' });
    }
    
    // Lógica de negocio mezclada
    if (req.body.recipientAccount === '00000000000000000000') {
      // Enviar email hardcodeado aquí mismo
      console.log('Cuenta sospechosa!');
      return res.status(400).json({ error: 'Cuenta bloqueada' });
    }
    
    // Acceso a BD directo
    const result = await db.query(
      'INSERT INTO disbursements ...',
      [/* ... */]
    );
    
    // Más lógica mezclada...
    
    res.json({ id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});