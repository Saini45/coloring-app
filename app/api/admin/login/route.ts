import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { comparePassword, createToken, hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password required' },
        { status: 400 }
      );
    }

    // Get admin user
    const result = await pool.query(
      'SELECT * FROM admin_users WHERE username = $1 AND is_active = true',
      [username]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const admin = result.rows[0];

    // Compare password
    const isMatch = await comparePassword(password, admin.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Update last login
    await pool.query(
      'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [admin.id]
    );

    // Create token
    const token = createToken(admin.id);

    // Return token (client will store in httpOnly cookie or localStorage)
    return NextResponse.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Initialize default admin if none exists
    const result = await pool.query('SELECT COUNT(*) FROM admin_users');
    const count = parseInt(result.rows[0].count);

    if (count === 0) {
      // Create default admin user
      const defaultPassword = 'change-this-in-production';
      const hashedPassword = await hashPassword(defaultPassword);

      await pool.query(
        `INSERT INTO admin_users (username, password_hash, email, is_active)
         VALUES ($1, $2, $3, $4)`,
        ['admin', hashedPassword, 'admin@rangpankh.co.in', true]
      );

      return NextResponse.json({
        success: true,
        message: 'Default admin user created',
        username: 'admin',
        password: defaultPassword,
        warning: 'CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin users already initialized',
    });
  } catch (err) {
    console.error('Admin initialization error:', err);
    return NextResponse.json(
      { error: 'Admin initialization failed' },
      { status: 500 }
    );
  }
}
