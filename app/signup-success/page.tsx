"use client";
import { Button, Flex, Text } from "@radix-ui/themes";
import { useRouter } from "next/navigation";

export default function SignupSuccessPage() {
  const router = useRouter();
  return (
    <Flex direction="column" align="center" justify="center" style={{ minHeight: "60vh" }}>
      <Text size="5" weight="bold" mb="4">회원가입이 완료되었습니다!</Text>
      <Text size="3" mb="6">환영합니다. 이제 모든 서비스를 이용하실 수 있습니다.</Text>
      <Button size="3" onClick={() => router.push("/")}>메인으로 이동</Button>
    </Flex>
  );
} 