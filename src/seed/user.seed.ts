import {
  DrinkingEnum,
  GenderEnum,
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
    'A perfect day for me is...',
    "I'm passionate about...",
    'The way to my heart is...',
    'My ideal weekend includes...',
    'I get excited when...',
    'My biggest goal is...',
    'I love to talk about...',
    'My favorite hobby is...',
    "Something I'll never get tired of...",
    "The best advice I've received is...",
    'My hidden talent is...',
    "I'm always down for...",
    'Something that makes me laugh is...',
    'My biggest pet peeve is...',
    "I can't live without...",
  ];

  const interestEntities = interests.map((interest) =>
    interestRepo.create({
      prompt: interest,
      answer: faker.lorem.sentence(),
    }),
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
    const maxAge = faker.number.int({ min: minAge + 1, max: 99 });
    const profile: Profile = profileRepo.create({
      city: faker.location.city(),
      work: faker.person.jobTitle(),
      languages: [
        faker.helpers.arrayElement([
          'English',
          'French',
          'Spanish',
          'German',
          'Italian',
        ]),
      ],
      min_age: minAge,
      max_age: maxAge,
      max_distance: faker.number.float({ min: 25, max: 150 }),
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

    const gender = faker.helpers.enumValue(GenderEnum);
    const age = faker.number.int({ min: 18, max: 40 });
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
