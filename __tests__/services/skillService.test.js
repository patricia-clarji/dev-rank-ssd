const skillService = require('../../services/skillService');
const Skill = require('../../models/mongo/Skill');
const User = require('../../models/mongo/User');
const AppError = require('../../utils/AppError');
const { createSkill } = require('../factories/skillFactory');
const { createUser } = require('../factories/userFactory');
const { clearMongoCollection } = require('../helpers/db');

describe('skillService', () => {
    it('should create a skill successfully', async () => {
      const skill = await skillService.createSkill({ name: 'NewSkill', category: ['frontend'], isPreset: true });
      expect(skill).toBeDefined();
      expect(skill.name).toBe('NewSkill');
      expect(skill.category).toContain('frontend');
      expect(skill.isPreset).toBe(true);
    });

    it('should get all skills with and without filters', async () => {
      await skillService.createSkill({ name: 'SkillA', category: ['backend'], isPreset: true });
      await skillService.createSkill({ name: 'SkillB', category: ['frontend'], isPreset: false });
      const all = await skillService.getAllSkills({});
      expect(all.length).toBeGreaterThanOrEqual(2);
      const filtered = await skillService.getAllSkills({ category: 'backend' });
      expect(filtered.some(s => s.category.includes('backend'))).toBe(true);
      const preset = await skillService.getAllSkills({ preset: 'true' });
      expect(preset.every(s => s.isPreset)).toBe(true);
    });

    it('should get a skill by id and throw if not found', async () => {
      const skill = await skillService.createSkill({ name: 'SkillGet', category: ['backend'] });
      const found = await skillService.getSkill(skill._id.toString());
      expect(found).toBeDefined();
      expect(found.name).toBe('SkillGet');
      await expect(skillService.getSkill('000000000000000000000000')).rejects.toThrow('Skill not found');
    });

    it('should get a skill by name and throw if not found', async () => {
      await skillService.createSkill({ name: 'SkillByName', category: ['backend'] });
      const found = await skillService.getSkillByName('SkillByName');
      expect(found).toBeDefined();
      expect(found.name).toBe('SkillByName');
      await expect(skillService.getSkillByName('Nonexistent')).rejects.toThrow('Skill not found');
    });

    it('should update a skill and handle duplicate name and not found', async () => {
      const skill1 = await skillService.createSkill({ name: 'SkillUp1', category: ['backend'] });
      const skill2 = await skillService.createSkill({ name: 'SkillUp2', category: ['frontend'] });
      const updated = await skillService.updateSkill(skill1._id.toString(), { name: 'SkillUp1New', category: ['backend'], isPreset: false });
      expect(updated.name).toBe('SkillUp1New');
      await expect(skillService.updateSkill(skill2._id.toString(), { name: 'SkillUp1New' })).rejects.toThrow(AppError);
      await expect(skillService.updateSkill('000000000000000000000000', { name: 'NoSkill' })).rejects.toThrow('Skill not found');
    });

    it('should delete a skill and throw if not found', async () => {
      const skill = await skillService.createSkill({ name: 'SkillDel2', category: ['backend'] });
      await expect(skillService.deleteSkill(skill._id.toString())).resolves.toBeUndefined();
      await expect(skillService.deleteSkill('000000000000000000000000')).rejects.toThrow('Skill not found');
    });

    it('should update skill by name successfully', async () => {
      await skillService.createSkill({ name: 'SkillByNameUp', category: ['backend'] });
      const updated = await skillService.updateSkillByName('SkillByNameUp', { name: 'SkillByNameUpNew', category: ['backend'], isPreset: true });
      expect(updated.name).toBe('SkillByNameUpNew');
      expect(updated.isPreset).toBe(true);
    });
  beforeEach(async () => {
    await clearMongoCollection(Skill);
    await clearMongoCollection(User);
  });

  it('should not allow duplicate skill creation', async () => {
    await createSkill({ name: 'UniqueSkill', category: ['backend'] });
    await expect(skillService.createSkill({ name: 'UniqueSkill', category: ['backend'] })).rejects.toThrow(AppError);
  });

  it('should update skill by name and handle duplicate name', async () => {
    await createSkill({ name: 'Skill1', category: ['backend'] });
    await createSkill({ name: 'Skill2', category: ['backend'] });
    await expect(skillService.updateSkillByName('Skill1', { name: 'Skill2' })).rejects.toThrow(AppError);
  });

  it('should delete skill by name and remove from users', async () => {
    const skill = await createSkill({ name: 'SkillDel', category: ['backend'] });
    const user = await createUser({ name: 'U', email: 'stest@test.com', skills: [skill._id] });
    await skillService.deleteSkillByName('SkillDel');
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.skills).not.toContainEqual(skill._id);
  });

  it('should throw if skill not found on update by name', async () => {
    await expect(skillService.updateSkillByName('Nonexistent', { name: 'NewName' })).rejects.toThrow('Skill not found');
  });

  it('should throw if skill not found on delete by name', async () => {
    await expect(skillService.deleteSkillByName('Nonexistent')).rejects.toThrow('Skill not found');
  });
});
