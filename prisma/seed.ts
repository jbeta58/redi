import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'
dotenv.config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const apps = [
  { id: 'clock',              name: 'Clock',                   description: 'Current time in large digits',                      has_config: true  },
  { id: 'word_clock',         name: 'Word Clock',              description: 'Time expressed in words with staircase layout',     has_config: false },
  { id: 'clock_date',         name: 'Clock & Date',            description: 'Time, day of week, and full date',                  has_config: true  },
  { id: 'three_cities_clock', name: '3 Cities Clock',          description: 'Current time in three cities with day/night color', has_config: true  },
  { id: 'date_progress',      name: 'Date Progress',           description: 'Year, month, and day progress bars',                has_config: false },
  { id: 'weather_today',      name: 'Weather Today & Tomorrow',description: 'Two-day forecast with condition illustration',      has_config: true  },
  { id: 'weather_three_days', name: '3-Day Weather',           description: 'Three-column weather forecast',                    has_config: true  },
  { id: 'moon_phase',         name: 'Moon Phase',              description: 'Current moon phase illustration and name',          has_config: false },
  { id: 'currency_trm',       name: 'COP/USD (TRM)',           description: 'Colombian peso to dollar rate with history chart',  has_config: true  },
  { id: 'currency_eur',       name: 'COP/EUR',                 description: 'Colombian peso to euro rate with history chart',   has_config: true,  is_active: false },
  { id: 'birthday',           name: 'Birthday',                description: 'Birthday reminder with cake illustration',          has_config: true  },
  { id: 'happy_birthday',     name: 'Happy Birthday',          description: 'Celebratory birthday message with balloons',        has_config: true  },
  { id: 'quotes',             name: 'Quotes',                  description: 'Scrolling inspirational quotes',                   has_config: false },
  { id: 'countdown',          name: 'Countdown',               description: 'Days until five fixed annual events',               has_config: true  },
  { id: 'national_flag',      name: 'National Flag',           description: 'Full-screen flag on each country\'s national day',  has_config: true  },
]

async function main() {
  console.log('Seeding apps...')

  for (const app of apps) {
    await prisma.app.upsert({
      where: { id: app.id },
      update: { name: app.name, description: app.description, has_config: app.has_config, is_active: app.is_active ?? true },
      create: { id: app.id, name: app.name, description: app.description, has_config: app.has_config, is_active: app.is_active ?? true },
    })
    console.log(`  ✓ ${app.id}`)
  }

  console.log('Done.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
