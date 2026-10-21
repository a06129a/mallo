import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const resource = searchParams.get('resource')
  const cursoId = searchParams.get('cursoId')
  try {
    if (resource === 'cursos') {
      const { rows } = await pool.query('SELECT id, nombre FROM cursos ORDER BY id')
      return NextResponse.json(rows)
    }
    if (resource === 'materias' && cursoId) {
      const { rows } = await pool.query('SELECT id, nombre FROM materias WHERE curso_id = $1 ORDER BY id', [cursoId])
      return NextResponse.json(rows)
    }
    if (resource === 'alumnos' && cursoId) {
      const { rows } = await pool.query('SELECT id, nombre, apellido FROM alumnos WHERE curso_id = $1 ORDER BY apellido, nombre', [cursoId])
      return NextResponse.json(rows)
    }
    if (resource === 'pasantes') {
      const { rows } = await pool.query('SELECT id, nombre, apellido, dni, fecha_nacimiento, direccion, dni_frente, dni_dorso, nombre_tutor, telefono, cv FROM pasantes ORDER BY apellido, nombre')
      return NextResponse.json(rows)
    }
    return NextResponse.json({ error: 'Recurso inválido' }, { status: 400 })
  } catch (error) {
    console.error('[v0] Error leyendo Neon:', error)
    return NextResponse.json({ error: 'No se pudieron cargar los datos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const body = await request.json()
  try {
    if (body.resource === 'curso') {
      const { rows } = await pool.query('INSERT INTO cursos (nombre) VALUES ($1) RETURNING id, nombre', [body.nombre])
      return NextResponse.json(rows[0])
    }
    if (body.resource === 'materia') {
      const { rows } = await pool.query('INSERT INTO materias (curso_id, nombre) VALUES ($1, $2) RETURNING id, nombre', [body.cursoId, body.nombre])
      return NextResponse.json(rows[0])
    }
    if (body.resource === 'alumno') {
      const { rows } = await pool.query('INSERT INTO alumnos (curso_id, nombre, apellido) VALUES ($1, $2, $3) RETURNING id, nombre, apellido', [body.cursoId, body.nombre, body.apellido])
      return NextResponse.json(rows[0])
    }
    if (body.resource === 'pasante') {
      const { rows } = await pool.query('INSERT INTO pasantes (nombre, apellido, dni, fecha_nacimiento, direccion, dni_frente, dni_dorso, nombre_tutor, telefono, cv) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *', [body.nombre, body.apellido, body.dni, body.fechaNacimiento || null, body.direccion, body.dniFrente || null, body.dniDorso || null, body.nombreTutor, body.telefono, body.cv || null])
      return NextResponse.json(rows[0])
    }
    return NextResponse.json({ error: 'Recurso inválido' }, { status: 400 })
  } catch (error) {
    console.error('[v0] Error guardando en Neon:', error)
    return NextResponse.json({ error: 'No se pudo guardar el registro' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const body = await request.json()
  try {
    if (body.resource === 'materia') {
      const { rows } = await pool.query('UPDATE materias SET nombre = $1 WHERE id = $2 RETURNING id, nombre', [body.nombre, body.id])
      return NextResponse.json(rows[0])
    }
    return NextResponse.json({ error: 'Recurso inválido' }, { status: 400 })
  } catch (error) {
    console.error('[v0] Error actualizando Neon:', error)
    return NextResponse.json({ error: 'No se pudo actualizar el registro' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const body = await request.json()
  try {
    const table = body.resource === 'curso' ? 'cursos' : body.resource === 'materia' ? 'materias' : body.resource === 'alumno' ? 'alumnos' : body.resource === 'pasante' ? 'pasantes' : null
    if (!table) return NextResponse.json({ error: 'Recurso inválido' }, { status: 400 })
    await pool.query(`DELETE FROM ${table} WHERE id = $1`, [body.id])
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[v0] Error eliminando en Neon:', error)
    return NextResponse.json({ error: 'No se pudo eliminar el registro' }, { status: 500 })
  }
}
