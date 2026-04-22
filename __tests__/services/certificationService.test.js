const certificationService = require('../../services/certificationService');
const CertificationRequest = require('../../models/mongo/CertificationRequest');
const User = require('../../models/mongo/User');
const AppError = require('../../utils/AppError');
const { createUser } = require('../factories/userFactory');
const { createCertification } = require('../factories/certificationFactory');
const { clearMongoCollection } = require('../helpers/db');


describe('certificationService', () => {
  let user;
  beforeEach(async () => {
    await clearMongoCollection(CertificationRequest);
    await clearMongoCollection(User);
    user = await createUser({ name: 'CertUser', email: 'cert@test.com' });
  });


  it('should not allow apply if user not found', async () => {
    await expect(certificationService.apply({ userId: '000000000000000000000000', cvUrl: '', experience: '', motivation: '', techExpertise: [] })).rejects.toThrow(AppError);
  });


  it('should not allow duplicate pending request', async () => {
    await createCertification(user._id);
    await expect(certificationService.apply({ userId: user._id, cvUrl: '', experience: '', motivation: '', techExpertise: [] })).rejects.toThrow(AppError);
  });


  it('should not approve/reject if not found or not pending', async () => {
    await expect(certificationService.approve('000000000000000000000000', 'note')).rejects.toThrow(AppError);
    const req = await createCertification(user._id);
    await certificationService.approve(req._id, 'note');
    await expect(certificationService.approve(req._id, 'note')).rejects.toThrow(AppError);
    const req2 = await createCertification(user._id);
    await expect(certificationService.reject(req2._id, 'note')).resolves.toBeDefined();
    await expect(certificationService.reject(req2._id, 'note')).rejects.toThrow(AppError);
  });

  it('should throw if certification request not found on getCertificationRequestById', async () => {
    await expect(certificationService.getCertificationRequestById('000000000000000000000000')).rejects.toThrow('Certification request not found');
  });
});
