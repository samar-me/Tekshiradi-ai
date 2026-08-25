import { createClient } from '@supabase/supabase-js';
import { User, ClassItem, Student, Submission, Result } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  serviceRoleKey &&
  !supabaseUrl.includes('dummy') &&
  !supabaseUrl.includes('placeholder') &&
  !serviceRoleKey.includes('dummy')
);

export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  serviceRoleKey || 'placeholder',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Resilient In-Memory DB Store for Local Development & Testing without Supabase cloud credentials
class InMemoryDB {
  public users: Map<string, User> = new Map();
  public classes: Map<string, ClassItem> = new Map();
  public students: Map<string, Student> = new Map();
  public submissions: Map<string, Submission> = new Map();
  public results: Map<string, Result> = new Map();
  public events: any[] = [];

  constructor() {
    // Seed a default test teacher for dev mode
    const defaultUser: User = {
      id: '00000000-0000-0000-0000-000000000001',
      telegram_id: 99999999,
      full_name: "Aziza Karimova",
      school_name: "45-maktab",
      subject: "Matematika",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.users.set(defaultUser.id, defaultUser);

    // Seed sample classes
    const class7A: ClassItem = {
      id: '00000000-0000-0000-0000-000000000002',
      teacher_id: defaultUser.id,
      name: '7-A',
      subject: 'Matematika',
      created_at: new Date().toISOString(),
    };
    const class8B: ClassItem = {
      id: '00000000-0000-0000-0000-000000000003',
      teacher_id: defaultUser.id,
      name: '8-B',
      subject: 'Algebra',
      created_at: new Date().toISOString(),
    };
    this.classes.set(class7A.id, class7A);
    this.classes.set(class8B.id, class8B);

    // Seed sample students
    const student1: Student = {
      id: '00000000-0000-0000-0000-000000000004',
      class_id: class7A.id,
      full_name: 'Ali Valiyev',
      created_at: new Date().toISOString(),
    };
    const student2: Student = {
      id: '00000000-0000-0000-0000-000000000005',
      class_id: class7A.id,
      full_name: 'Fotima Rahimova',
      created_at: new Date().toISOString(),
    };
    const student3: Student = {
      id: '00000000-0000-0000-0000-000000000006',
      class_id: class8B.id,
      full_name: 'Jasur Saidov',
      created_at: new Date().toISOString(),
    };
    this.students.set(student1.id, student1);
    this.students.set(student2.id, student2);
    this.students.set(student3.id, student3);
  }
}

// Global in-memory DB singleton across hot-reloads
const globalForMemory = globalThis as unknown as { inMemoryDB?: InMemoryDB };
export const memoryDB = globalForMemory.inMemoryDB || new InMemoryDB();
if (process.env.NODE_ENV !== 'production') globalForMemory.inMemoryDB = memoryDB;
