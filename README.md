## Getting Started

To run locally

```bash
bun install && bun run dev
```

Then just open [http://localhost:3000](http://localhost:3000) in your browser and you're set.

## Tech Stack

Here's what I used to build this:

- **Next.js 15** with App Router for better routing and SSR
- **TypeScript** for type safety
- **Shadcn UI** for accessible components
- **Tailwind CSS** for styling
- **SWR** for data fetching
- **Zustand** for state management
- **Axios** for API calls

## How I Built It

### Frontend Organization
- Reusable UI in `components/ui`
- App components in `app/components`

### Auth & API
- Token auth with cookies
- Automatic token refresh
- Rate limiting and error handling

#### Display
- `FileTree`: Main container
- `FileTreeDirectory`: Folder handling
- `FileTreeFile`: File display
- Lazy loading for better performance

#### Data Management
- `useFileTree` hook for state

### Why I Split the Views

Basically, I separated the views into two because I felt like having one single tree that has to handle both states would be too convoluted, and also a bit feature bloated for the user.

### Single Knowledge Base

Since I didn't have access to and endpoint to list all knowledge bases or get a single one, I decided to just store the knowledge base in local storage. Obviously it was for the constrains of this project, in production we would use a database and properly manage multiple connections/knowledge bases.

## Deployment

Deploy on [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create_next_app&utm_campaign=create_next_app_readme) - they built Next.js.

Need more info? Check the [deployment docs](https://nextjs.org/docs/app/building-your-application/deploying).