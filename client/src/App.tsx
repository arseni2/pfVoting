import {
  ActionIcon,
  AppShell,
  Group,
  Text,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { PageMain } from "./pages/main/page";

function App() {
  return (
    <AppShell padding="md">
      <Header />

      <AppShell.Main>
        <PageMain />
      </AppShell.Main>
    </AppShell>
  );
}

export default App;

const Header = () => {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  return (
    <AppShell.Header p={"xs"} pos={"relative"}>
      <Group h="100%" w="100%" px="md" justify="space-between">
        <Text fw={700} size="lg">
          Голосование
        </Text>
        <Group justify="center">
          <ActionIcon
            onClick={() =>
              setColorScheme(computedColorScheme === "light" ? "dark" : "light")
            }
            variant="default"
            size="xl"
            radius="md"
            aria-label="Toggle color scheme"
          >
            {computedColorScheme == "dark" ? (
              <IconSun stroke={1.5} />
            ) : (
              <IconMoon stroke={1.5} />
            )}
          </ActionIcon>
        </Group>
      </Group>
    </AppShell.Header>
  );
};
