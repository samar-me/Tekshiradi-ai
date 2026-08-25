import { NextRequest } from 'next/server';
import { createSessionToken } from '../src/lib/auth/session';
import { memoryDB } from '../src/lib/supabase/admin';
import { GET as getClasses, POST as postClass } from '../src/app/api/classes/route';
import {
  GET as getClassById,
  PATCH as patchClass,
  DELETE as deleteClass,
} from '../src/app/api/classes/[id]/route';
import {
  GET as getStudents,
  POST as postStudent,
} from '../src/app/api/classes/[id]/students/route';
import {
  PATCH as patchStudent,
  DELETE as deleteStudent,
} from '../src/app/api/students/[id]/route';
import { GET as getMe } from '../src/app/api/me/route';

async function runPhase2Tests() {
  console.log('🧪 Starting Phase 2 Classes & Student Management Tests...\n');

  // Setup Two Teachers: Teacher A and Teacher B
  const teacherA = {
    userId: 'teacher-a-uuid-11111',
    telegramId: 11111111,
    fullName: 'Aziza Karimova (Teacher A)',
  };
  const teacherB = {
    userId: 'teacher-b-uuid-22222',
    telegramId: 22222222,
    fullName: 'Bobur Saidov (Teacher B)',
  };

  // Seed teachers into in-memory DB
  memoryDB.users.set(teacherA.userId, {
    id: teacherA.userId,
    telegram_id: teacherA.telegramId,
    full_name: teacherA.fullName,
    school_name: '45-maktab',
    subject: 'Matematika',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  memoryDB.users.set(teacherB.userId, {
    id: teacherB.userId,
    telegram_id: teacherB.telegramId,
    full_name: teacherB.fullName,
    school_name: '12-maktab',
    subject: 'Ingliz tili',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const tokenA = await createSessionToken(teacherA);
  const tokenB = await createSessionToken(teacherB);

  // Helper to create authed request
  function createReq(url: string, method: string, token: string, body?: any) {
    return new NextRequest(new URL(url, 'http://localhost:3000'), {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // --- SECTION 1: CLASS TESTS ---
  console.log('1️⃣ Testing Class Creation & Validation:');

  // 1.1 Empty class should be rejected
  const emptyClassReq = createReq('/api/classes', 'POST', tokenA, { name: '', subject: '' });
  const emptyRes = await postClass(emptyClassReq);
  const emptyData = await emptyRes.json();
  if (emptyRes.status === 400 && emptyData.error) {
    console.log('   ✅ Empty class name/subject rejected (400)');
  } else {
    console.error('   ❌ Expected empty class rejection, got:', emptyRes.status, emptyData);
    process.exit(1);
  }

  // 1.2 Teacher A creates 7-A Matematika
  const createClassAReq = createReq('/api/classes', 'POST', tokenA, {
    name: '7-A',
    subject: 'Matematika',
  });
  const createClassARes = await postClass(createClassAReq);
  const classAData = await createClassARes.json();
  if (createClassARes.status === 201 && classAData.class?.id) {
    console.log(`   ✅ Teacher A created class: ${classAData.class.name} (${classAData.class.id})`);
  } else {
    console.error('   ❌ Failed to create class for Teacher A:', classAData);
    process.exit(1);
  }
  const classAId = classAData.class.id;

  // 1.3 Teacher B creates 9-B Ingliz tili
  const createClassBReq = createReq('/api/classes', 'POST', tokenB, {
    name: '9-B',
    subject: 'Ingliz tili',
  });
  const createClassBRes = await postClass(createClassBReq);
  const classBData = await createClassBRes.json();
  const classBId = classBData.class.id;
  console.log(`   ✅ Teacher B created class: ${classBData.class.name} (${classBId})`);

  // --- SECTION 2: CLASS LIST & ISOLATION ---
  console.log('\n2️⃣ Testing Class Isolation & Scoping:');

  // 2.1 Teacher A lists classes -> should ONLY include Teacher A's classes
  const listAReq = createReq('/api/classes', 'GET', tokenA);
  const listARes = await getClasses(listAReq);
  const listAData = await listARes.json();
  const teacherAClassIds = listAData.classes.map((c: any) => c.id);

  if (teacherAClassIds.includes(classAId) && !teacherAClassIds.includes(classBId)) {
    console.log("   ✅ Teacher A class list contains ONLY Teacher A's classes");
  } else {
    console.error("   ❌ Teacher A class list isolation failed:", listAData.classes);
    process.exit(1);
  }

  // 2.2 Teacher B cannot fetch Teacher A's class by ID
  const fetchOtherClassReq = createReq(`/api/classes/${classAId}`, 'GET', tokenB);
  const fetchOtherClassRes = await getClassById(fetchOtherClassReq, { params: { id: classAId } });
  if (fetchOtherClassRes.status === 404) {
    console.log("   ✅ Teacher B forbidden from reading Teacher A's class (404/Not Found)");
  } else {
    console.error("   ❌ Teacher B unexpectedly accessed Teacher A's class:", fetchOtherClassRes.status);
    process.exit(1);
  }

  // 2.3 Teacher B cannot edit Teacher A's class
  const editOtherClassReq = createReq(`/api/classes/${classAId}`, 'PATCH', tokenB, { name: 'Hacked' });
  const editOtherClassRes = await patchClass(editOtherClassReq, { params: { id: classAId } });
  if (editOtherClassRes.status === 404) {
    console.log("   ✅ Teacher B forbidden from editing Teacher A's class (404)");
  } else {
    console.error("   ❌ Teacher B edited Teacher A's class!");
    process.exit(1);
  }

  // 2.4 Teacher A can edit own class
  const editOwnClassReq = createReq(`/api/classes/${classAId}`, 'PATCH', tokenA, { name: '7-A (Advanced)' });
  const editOwnClassRes = await patchClass(editOwnClassReq, { params: { id: classAId } });
  const editOwnData = await editOwnClassRes.json();
  if (editOwnClassRes.status === 200 && editOwnData.class?.name === '7-A (Advanced)') {
    console.log("   ✅ Teacher A successfully edited own class name");
  } else {
    console.error("   ❌ Teacher A failed to edit own class:", editOwnData);
    process.exit(1);
  }

  // --- SECTION 3: STUDENT MANAGEMENT & ISOLATION ---
  console.log('\n3️⃣ Testing Student Management & Cross-Teacher Isolation:');

  // 3.1 Teacher A adds student to own class
  const addStudentReq = createReq(`/api/classes/${classAId}/students`, 'POST', tokenA, {
    fullName: 'Ali Valiyev',
  });
  const addStudentRes = await postStudent(addStudentReq, { params: { id: classAId } });
  const studentData = await addStudentRes.json();
  if (addStudentRes.status === 201 && studentData.student?.id) {
    console.log(`   ✅ Teacher A added student: ${studentData.student.full_name} (${studentData.student.id})`);
  } else {
    console.error('   ❌ Failed to add student:', studentData);
    process.exit(1);
  }
  const studentAId = studentData.student.id;

  // 3.2 Add second student to Teacher A's class
  const addStudent2Req = createReq(`/api/classes/${classAId}/students`, 'POST', tokenA, {
    fullName: 'Madina Karimova',
  });
  const addStudent2Res = await postStudent(addStudent2Req, { params: { id: classAId } });
  const student2Data = await addStudent2Res.json();
  const student2Id = student2Data.student.id;
  console.log(`   ✅ Teacher A added second student: ${student2Data.student.full_name}`);

  // 3.3 Teacher B cannot add student to Teacher A's class
  const illegalAddStudentReq = createReq(`/api/classes/${classAId}/students`, 'POST', tokenB, {
    fullName: 'Imposter Student',
  });
  const illegalAddRes = await postStudent(illegalAddStudentReq, { params: { id: classAId } });
  if (illegalAddRes.status === 404) {
    console.log("   ✅ Teacher B cannot add student to Teacher A's class (404)");
  } else {
    console.error("   ❌ Teacher B was able to add student to Teacher A's class!", illegalAddRes.status);
    process.exit(1);
  }

  // 3.4 Teacher A lists students
  const listStudentsReq = createReq(`/api/classes/${classAId}/students`, 'GET', tokenA);
  const listStudentsRes = await getStudents(listStudentsReq, { params: { id: classAId } });
  const listStudentsData = await listStudentsRes.json();
  if (listStudentsRes.status === 200 && listStudentsData.students.length === 2) {
    console.log(`   ✅ Teacher A student list returned 2 students accurately`);
  } else {
    console.error('   ❌ Student list count mismatch:', listStudentsData);
    process.exit(1);
  }

  // 3.5 Teacher B cannot edit Teacher A's student
  const illegalEditStudentReq = createReq(`/api/students/${studentAId}`, 'PATCH', tokenB, {
    fullName: 'Ali Hacked',
  });
  const illegalEditStudentRes = await patchStudent(illegalEditStudentReq, { params: { id: studentAId } });
  if (illegalEditStudentRes.status === 404) {
    console.log("   ✅ Teacher B cannot edit Teacher A's student (404)");
  } else {
    console.error("   ❌ Teacher B was able to edit Teacher A's student!", illegalEditStudentRes.status);
    process.exit(1);
  }

  // 3.6 Teacher A can edit own student
  const editStudentReq = createReq(`/api/students/${studentAId}`, 'PATCH', tokenA, {
    fullName: 'Ali Valiyev (Tahrirlangan)',
  });
  const editStudentRes = await patchStudent(editStudentReq, { params: { id: studentAId } });
  const editStudentData = await editStudentRes.json();
  if (editStudentRes.status === 200 && editStudentData.student?.full_name === 'Ali Valiyev (Tahrirlangan)') {
    console.log('   ✅ Teacher A successfully edited student name');
  } else {
    console.error('   ❌ Teacher A failed to edit student:', editStudentData);
    process.exit(1);
  }

  // 3.7 Teacher B cannot delete Teacher A's student
  const illegalDeleteStudentReq = createReq(`/api/students/${student2Id}`, 'DELETE', tokenB);
  const illegalDeleteStudentRes = await deleteStudent(illegalDeleteStudentReq, { params: { id: student2Id } });
  if (illegalDeleteStudentRes.status === 404) {
    console.log("   ✅ Teacher B cannot delete Teacher A's student (404)");
  } else {
    console.error("   ❌ Teacher B deleted Teacher A's student!");
    process.exit(1);
  }

  // 3.8 Teacher A deletes student 2
  const deleteStudentReq = createReq(`/api/students/${student2Id}`, 'DELETE', tokenA);
  const deleteStudentRes = await deleteStudent(deleteStudentReq, { params: { id: student2Id } });
  if (deleteStudentRes.status === 200) {
    console.log('   ✅ Teacher A successfully deleted student 2');
  } else {
    console.error('   ❌ Failed to delete student 2:', deleteStudentRes.status);
    process.exit(1);
  }

  // --- SECTION 4: REAL-TIME HOME STATS ACCURACY ---
  console.log('\n4️⃣ Testing Home Statistics Accuracy:');

  const meReq = createReq('/api/me', 'GET', tokenA);
  const meRes = await getMe(meReq);
  const meData = await meRes.json();

  if (meRes.status === 200 && meData.stats?.classCount === 1 && meData.stats?.studentCount === 1) {
    console.log(`   ✅ Teacher A stats verified: ${meData.stats.classCount} class, ${meData.stats.studentCount} student`);
  } else {
    console.error('   ❌ Home stats mismatch for Teacher A:', meData.stats);
    process.exit(1);
  }

  // --- SECTION 5: CLASS DELETION ---
  console.log('\n5️⃣ Testing Class Deletion:');

  // Teacher A deletes own class
  const deleteClassReq = createReq(`/api/classes/${classAId}`, 'DELETE', tokenA);
  const deleteClassRes = await deleteClass(deleteClassReq, { params: { id: classAId } });
  if (deleteClassRes.status === 200) {
    console.log('   ✅ Teacher A successfully deleted own class');
  } else {
    console.error('   ❌ Failed to delete class:', deleteClassRes.status);
    process.exit(1);
  }

  // After class deletion, Teacher A classCount and studentCount should be 0
  const meAfterReq = createReq('/api/me', 'GET', tokenA);
  const meAfterRes = await getMe(meAfterReq);
  const meAfterData = await meAfterRes.json();

  if (meAfterData.stats?.classCount === 0 && meAfterData.stats?.studentCount === 0) {
    console.log(`   ✅ Teacher A stats updated to 0 classes and 0 students after deletion`);
  } else {
    console.error('   ❌ Post-deletion stats mismatch:', meAfterData.stats);
    process.exit(1);
  }

  console.log('\n🎉 ALL PHASE 2 TESTS PASSED!\n');
}

runPhase2Tests().catch((err) => {
  console.error('Phase 2 test run error:', err);
  process.exit(1);
});
