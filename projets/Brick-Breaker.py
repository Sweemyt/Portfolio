import pygame, sys
pygame.init()

WIDTH, HEIGHT = 800, 600

#setup
window = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption('Brick Breaker')
clock = pygame.time.Clock()
run = True


# colors
bg = (0, 0, 0)
#Paddel color
Paddle_color = (255, 255, 255)
Paddle_outline = (100, 100, 100)
#ball color
Ball_color = (255, 255, 255)
#block color
Block_white = (255, 255, 255)
Block_grey = (128, 128, 128)
Block_red = (139, 0, 0)


dt = 0
cols = 6
rows = 6


class wall():
    def __init__(self):
        self.width = WIDTH // cols
        self.height = 40

    def create_wall(self):
        self.blocks = []
        block_individual = []
        for row in range(rows):
            block_row = []
            for col in range(cols):
                block_x = col * self.width
                block_y = row * self.height
                rect = pygame.Rect(block_x, block_y, self.width, self.height)
                #if row < 1: 
                #    strength = 3
                #elif row < 3: 
                #    strength = 2
                if row < 6: 
                    strength = 1
                block_individual = [rect, strength]
                block_row.append(block_individual)
            self.blocks.append(block_row)

    def draw_wall(self):
        for row in self.blocks:
            for block in row:
                if block[1] == 1:
                    block_color = Block_white
                elif block[1] == 2:
                    block_color = Block_grey
                elif block[1] == 3:
                    block_color = Block_red
                pygame.draw.rect(window, block_color, block[0])
                pygame.draw.rect(window, bg, block[0], 3)



class paddle():
    def __init__(self):
        self.width = 120
        self.height = 20
        self.x = WIDTH // 2 #int((WIDTH // 20) - (self.width // 2))
        self.y = HEIGHT - 30 #HEIGHT - (self.height * 2)
        self.rect = pygame.Rect(self.x, self.y, self.width, self.height)
        self.speed = 10
        self.direction = 0

    # Paddel movement
    def move(self):
        self.direction = 0 
        keys = pygame.key.get_pressed()
        if keys[pygame.K_a] and self.x > 0:
            self.x -= 1 * dt 
        if keys[pygame.K_d] and self.x < WIDTH - self.width:
            self.x += 1 * dt 
        if keys[pygame.K_LEFT] and self.x > 0:
            self.x -= 1 * dt
        if keys[pygame.K_RIGHT] and self.x < WIDTH - self.width:
            self.x += 1 * dt

    def draw(self):
        # Draw the paddle
        pygame.draw.rect(window, Paddle_color, (self.x, self.y, self.width, self.height))

#create paddle
player_paddle = paddle()


class game_ball():
    def __init__(self, x, y):
        self.ball_rad = 7
        self.x = x - self.ball_rad
        self.y = y
        self.rect = pygame.Rect(self.x, self.y, self.ball_rad * 2, self.ball_rad * 2)
        self.speed_x = 4
        self.speed_y = -4
        self.collision_tolerance = 2

    def move(self):
        if self.rect.left < 0 or self.rect.right > WIDTH:
            self.speed_x *= -1

        if self.rect.top < 0:
            self.speed_y *= -1

        if self.rect.bottom > HEIGHT: 
            return True
    
        self.rect.x += self.speed_x
        self.rect.y += self.speed_y
    
        return False
    

    def draw(self):
        # Draw a ball
        pygame.draw.circle(window, Ball_color, (self.rect.x + self.ball_rad, self.rect.y + self.ball_rad), self.ball_rad)
        pygame.draw.circle(window, Paddle_outline, (self.rect.x + self.ball_rad, self.rect.y + self.ball_rad),self.ball_rad, 3)

    
#create block
wall = wall()
wall.create_wall()

#create ball
ball = game_ball(400, 300)



# Game loop
while run:

    # Check for events
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            run = False

    window.fill(0) 
    
    wall.create_wall()
    wall.draw_wall()

    player_paddle.draw()
    player_paddle.move()


    ball.draw()
    ball.move()




  # Update the display
    pygame.display.flip()

    # limits FPS to 60
    # dt is delta time in seconds since last frame, used for framerate-
    # independent physics.
    dt = clock.tick(60)



pygame.quit()