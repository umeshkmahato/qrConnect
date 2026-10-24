/**
 * Synthetic development seed — refuses to run in production.
 * Creates: platform admin, one approved society org + members, one pending org,
 * vehicles (active/pending), QR token (prints the plaintext token once),
 * a contact request, and an abuse report. No real personal data.
 */
const { PrismaClient } = require('@prisma/client');
const { createHash, randomBytes } = require('crypto');

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed in production.');
  process.exit(1);
}

const prisma = new PrismaClient();
const sha256 = (v) => createHash('sha256').update(v).digest('hex');

async function main() {
  const admin = await prisma.user.upsert({
    where: { phone: '+919900000001' },
    update: {},
    create: { phone: '+919900000001', fullName: 'Platform Admin (dev)', platformRole: 'PLATFORM_SUPER_ADMIN' },
  });
  const owner = await prisma.user.upsert({
    where: { phone: '+919900000002' },
    update: {},
    create: { phone: '+919900000002', fullName: 'Asha Resident (dev)' },
  });
  const guard = await prisma.user.upsert({
    where: { phone: '+919900000003' },
    update: {},
    create: { phone: '+919900000003', fullName: 'Ravi Guard (dev)' },
  });
  const outsider = await prisma.user.upsert({
    where: { phone: '+919900000004' },
    update: {},
    create: { phone: '+919900000004', fullName: 'Dev User (dev)' },
  });

  const org = await prisma.organization.upsert({
    where: { inviteCode: 'GREENVW1' },
    update: {},
    create: {
      name: 'Greenview Heights (dev)',
      type: 'RESIDENTIAL_SOCIETY',
      status: 'APPROVED',
      addressLine1: '12 Lake Road', city: 'Pune', state: 'Maharashtra', pincode: '411001',
      repName: 'Secretary', repPhone: '+919900000010',
      inviteCode: 'GREENVW1', createdById: owner.id,
      memberships: {
        create: [
          { userId: owner.id, role: 'ORGANIZATION_OWNER', status: 'APPROVED' },
          { userId: guard.id, role: 'SECURITY_GUARD', status: 'APPROVED' },
          { userId: outsider.id, role: 'REGISTERED_USER', status: 'APPROVED' },
        ],
      },
    },
  });

  await prisma.organization.upsert({
    where: { inviteCode: 'PENDNG01' },
    update: {},
    create: {
      name: 'Pending Tech Park (dev)',
      type: 'OFFICE_COMPANY', status: 'PENDING_VERIFICATION',
      addressLine1: '5 IT Lane', city: 'Bengaluru', state: 'Karnataka', pincode: '560001',
      repName: 'Facilities', repPhone: '+919900000011',
      inviteCode: 'PENDNG01', createdById: owner.id,
      memberships: { create: [{ userId: owner.id, role: 'ORGANIZATION_OWNER', status: 'APPROVED' }] },
    },
  });

  let vehicle = await prisma.vehicle.findFirst({ where: { registrationNumber: 'MH12AB1234', orgId: org.id } });
  const qrToken = randomBytes(32).toString('base64url');
  if (!vehicle) {
    vehicle = await prisma.vehicle.create({
      data: {
        orgId: org.id, registrationNumber: 'MH12AB1234', vehicleType: 'CAR',
        make: 'Maruti', model: 'Swift', color: 'White', status: 'ACTIVE', createdById: owner.id,
        memberships: { create: [{ userId: owner.id, associationType: 'OWNER' }] },
        sharing: { create: { shareOwnerName: true } },
        qrTokens: { create: [{ tokenHash: sha256(qrToken) }] },
      },
    });
    console.log(`\nDev QR token for MH12AB1234 (also written to prisma/dev-qr-token.txt):\n  ${qrToken}\n`);
    require('fs').writeFileSync(__dirname + '/dev-qr-token.txt', qrToken + '\n');
  }

  await prisma.contactRequest.create({
    data: {
      vehicleId: vehicle.id, orgId: org.id, requesterId: outsider.id,
      category: 'PARKING', message: 'Your car is blocking the gate.',
    },
  }).catch(() => {});

  await prisma.abuseReport.create({
    data: { reporterId: owner.id, reason: 'Test report (dev)', details: 'Synthetic seed data.' },
  }).catch(() => {});

  console.log('Seed complete. Dev login: request OTP for +919900000001..4 (OTP_DEV_ECHO returns the code when enabled).');
}

main().finally(() => prisma.$disconnect());
