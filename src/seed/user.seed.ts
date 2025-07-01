import {
  DrinkingEnum,
  OrientationEnum,
  PoliticsEnum,
  RelationshipTypeEnum,
  ReligionEnum,
  SmokingEnum,
  ZodiacEnum,
} from '../modules/profile/enums';

import { DataSource, DeepPartial } from 'typeorm';
import { Interest } from 'src/common/entities/interest.entity';
import { Profile } from 'src/common/entities/profile.entity';
import { User } from 'src/common/entities/user.entity';
import { faker } from '@faker-js/faker';
import { Point } from 'geojson';

export async function seedInterests(dataSource: DataSource) {
  const interestRepo = dataSource.getRepository(Interest);

  const interests = [
    'Music',
    'Sports',
    'Travel',
    'Cooking',
    'Reading',
    'Gaming',
    'Art',
    'Technology',
    'Fitness',
    'Movies',
  ];

  const interestEntities = interests.map((description) =>
    interestRepo.create({ description }),
  );

  await interestRepo.save(interestEntities);
  console.log(`✅ Seeded ${interestEntities.length} interests`);
}

export async function seedUsers(dataSource: DataSource, count = 50) {
  const userRepo = dataSource.getRepository(User);
  const profileRepo = dataSource.getRepository(Profile);
  const interestRepo = dataSource.getRepository(Interest);

  const allInterests = await interestRepo.find();
  if (allInterests.length === 0) {
    throw new Error('No interests found — please seed interests first');
  }

  const users: User[] = [];

  for (let i = 0; i < count; i++) {
    const minAge = faker.number.int({ min: 18, max: 25 });
    const maxAge = faker.number.int({ min: minAge + 1, max: 60 });
    const profile: Profile = profileRepo.create({
      city: 'Paris',
      work: faker.person.jobTitle(),
      languages: faker.helpers.arrayElements(
        ['en', 'fr', 'es', 'de', 'it'],
        faker.number.int({ min: 1, max: 3 }),
      ),
      min_age: minAge,
      max_age: maxAge,
      max_distance: faker.number.float({ min: 5, max: 100 }),
      orientation: faker.helpers.enumValue(OrientationEnum),
      relationship_type: faker.helpers.enumValue(RelationshipTypeEnum),
      smoking: faker.helpers.enumValue(SmokingEnum),
      drinking: faker.helpers.enumValue(DrinkingEnum),
      religion: faker.helpers.enumValue(ReligionEnum),
      politics: faker.helpers.enumValue(PoliticsEnum),
      zodiac: faker.helpers.enumValue(ZodiacEnum),
      interests: faker.helpers.arrayElements(
        allInterests,
        faker.number.int({ min: 1, max: 5 }),
      ),
    } as DeepPartial<Profile>);
    await profileRepo.save(profile);

    const gender = faker.helpers.arrayElement([0, 1, 2]);
    const age = faker.number.int({ min: 18, max: 70 });
    const location = {
      type: 'Point',
      coordinates: [faker.location.longitude(), faker.location.latitude()],
    };

    const user = userRepo.create({
      user_id: faker.string.uuid(),
      name: faker.person.firstName(gender === 0 ? 'female' : 'male'),
      surname: faker.person.lastName(),
      gender,
      age,
      location: location as Point,
      rarity: faker.number.int({ min: 1, max: 10 }),
      currency: faker.number.int({ min: 0, max: 1000 }),
      profile,
    });
    users.push(user);
  }

  await userRepo.save(users);
  console.log(`✅ Seeded ${users.length} users`);
}

export async function seedUsersAndInterests(
  dataSource: DataSource,
  userCount = 50,
) {
  await seedInterests(dataSource);
  await seedUsers(dataSource, userCount);
}
