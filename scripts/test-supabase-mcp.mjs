import { URL, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { readdirSync, statSync } from 'node:fs';

function resolveFromNpx(packageSubpath) {
  const npmCacheRoot = join(process.env.HOME, '.npm', '_npx');
  const candidateDirs = readdirSync(npmCacheRoot)
    .map((entry) => join(npmCacheRoot, entry, 'node_modules'))
    .filter((dir) => {
      try {
        return statSync(dir).isDirectory();
      } catch {
        return false;
      }
    });

  for (const dir of candidateDirs) {
    try {
      const resolved = join(dir, packageSubpath);
      // Throws if the file does not exist
      statSync(resolved);
      return pathToFileURL(resolved).href;
    } catch {
      // Try next directory
    }
  }

  throw new Error(`Could not locate ${packageSubpath} under ~/.npm/_npx`);
}

const supabaseModuleUrl = resolveFromNpx('@supabase/mcp-server-supabase/dist/index.js');
const platformModuleUrl = resolveFromNpx('@supabase/mcp-server-supabase/dist/platform/api-platform.js');
const clientModuleUrl = resolveFromNpx('@modelcontextprotocol/sdk/dist/esm/client/index.js');
const inMemoryModuleUrl = resolveFromNpx('@modelcontextprotocol/sdk/dist/esm/inMemory.js');

const { createSupabaseMcpServer } = await import(supabaseModuleUrl);
const { createSupabaseApiPlatform } = await import(platformModuleUrl);
const { Client } = await import(clientModuleUrl);
const { InMemoryTransport } = await import(inMemoryModuleUrl);

async function main() {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const apiUrl = process.env.SUPABASE_URL;

  if (!accessToken || !apiUrl) {
    throw new Error('SUPABASE_ACCESS_TOKEN and SUPABASE_URL must be set in the environment.');
  }

  const projectRef = process.env.SUPABASE_PROJECT_REF ?? deriveProjectRef(apiUrl);

  const platform = createSupabaseApiPlatform({
    accessToken,
    apiUrl,
  });

  const server = createSupabaseMcpServer({
    platform,
    projectId: projectRef,
  });

  const client = new Client(
    {
      name: 'codex-supabase-mcp-test',
      version: '0.1.0',
    },
    {
      capabilities: {
        filtering: {
          resources: true,
        },
      },
    }
  );

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  console.log('MCP server capabilities');

  const tools = await client.listTools({});
  console.log('Tools:', tools.tools.map((tool) => tool.name));

  try {
    const resources = await client.listResources({});
    console.log('Resources:', resources.resources.map((resource) => resource.uri));
  } catch (error) {
    console.warn('Resources unavailable:', error.message ?? error);
  }
}

function deriveProjectRef(apiUrl) {
  try {
    const { host } = new URL(apiUrl);
    const [subdomain] = host.split('.');
    if (!subdomain) {
      throw new Error(`Cannot parse project reference from host '${host}'`);
    }
    return subdomain;
  } catch (error) {
    throw new Error(`Invalid SUPABASE_URL '${apiUrl}': ${error.message}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
