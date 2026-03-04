import { Accordion, Container, Title, Typography } from "@mantine/core";

export const PageMain = () => {
  return (
    <Container>
      <Title ta="center">Голосования</Title>

      <Accordion variant="separated" defaultValue="reset-password">
        <Accordion.Item value="reset-password">
          <Accordion.Control>How can I reset my password?</Accordion.Control>
          <Accordion.Panel
            style={{ display: "flex", background: "rgba(0,0,0,0.5)", width: "20%" }}
          >
            test2
            <Typography> 20 votes </Typography>
          </Accordion.Panel>
          <Accordion.Panel>test2</Accordion.Panel>
          <Accordion.Panel>test2</Accordion.Panel>
          <Accordion.Panel>test2</Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Container>
  );
};
