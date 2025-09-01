// Javastart.java  
// This program begins a java program

import java.awt.*;
import java.applet.Applet;
import java.awt.event.ActionListener;
import java.util.Random;
import javax.swing.Timer;
import java.awt.event.ActionEvent;

public class TowerDefenseFinal extends Applet
{
	Image virtualMem;
	Graphics gBuffer;

	int appletWidth, appletHeight, diviser;

	int xCoord,yCoord;

	boolean first, pause, start, lose;

	int gold, lives, level;
	int button;

	Polygon path;

	Rectangle play_button;

	Rectangle start_button, autogun_button, rocket_button, freezer_button, laser_button, tesla_button, burner_button;
	Rectangle nuker_button, radar_button, vortex_button, bank_button, damage_button, range_button, rate_button, sell_button;

	Tower[] tower;
	Rectangle[] building;
	int maxTowers;
	boolean upgrade;
	int choice;

	Creep[] creep;
	int wave, enemies;
	int points;
	int[] type;
	int wait;

	Vortex[] vortex;
	int maxVortex;
	Rectangle[] portal;

	int intrest;

	public void init()
	{
		appletWidth = getWidth();
		appletHeight = getHeight();
		diviser = 1024/appletWidth;

		virtualMem = createImage(appletWidth,appletHeight);
		gBuffer = virtualMem.getGraphics();

		xCoord = 0;
		yCoord = 0;

		gold = 1000;
		lives = 10;
		level = 0;
		button = 0;

		first = false;	//initiates start screen
		pause = true;	//pauses the game
		start = true;	//starts a new round
		lose = false;	//you lost the game

		tower = new Tower[100];
		building = new Rectangle[100];
		maxTowers = 0;
		upgrade = false;
		choice = -1;

		creep = new Creep[25];
		wave = 0;
		enemies = 0;
		type = new int[10000];
		wait = 0;

		vortex = new Vortex[100];
		maxVortex = 0;
		portal = new Rectangle[100];

		intrest = 3;

		int[] xPath = {(0/diviser),(150/diviser),(150/diviser),(50/diviser),(50/diviser),(300/diviser),(300/diviser),(100/diviser),(100/diviser),(375/diviser),(375/diviser),(750/diviser),(750/diviser),(550/diviser),(550/diviser),(700/diviser),(700/diviser),(600/diviser),(600/diviser),(800/diviser),(800/diviser),(650/diviser),(650/diviser),(750/diviser),(750/diviser),(500/diviser),(500/diviser),(700/diviser),(700/diviser),(425/diviser),(425/diviser),(50/diviser),(50/diviser),(250/diviser),(250/diviser),(100/diviser),(100/diviser),(200/diviser),(200/diviser),(0/diviser)};
		int[] yPath = {(325/diviser),(325/diviser),(200/diviser),(200/diviser),(50/diviser),(50/diviser),(500/diviser),(500/diviser),(600/diviser),(600/diviser),(50/diviser),(50/diviser),(250/diviser),(250/diviser),(600/diviser),(600/diviser),(550/diviser),(550/diviser),(325/diviser),(325/diviser),(375/diviser),(375/diviser),(500/diviser),(500/diviser),(650/diviser),(650/diviser),(200/diviser),(200/diviser),(100/diviser),(100/diviser),(650/diviser),(650/diviser),(450/diviser),(450/diviser),(100/diviser),(100/diviser),(150/diviser),(150/diviser),(375/diviser),(375/diviser)};
		path = new Polygon(xPath,yPath,40);

		play_button = new Rectangle((200/diviser),(600/diviser),(300/diviser),(100/diviser));

		start_button = new Rectangle((945/diviser),(625/diviser),(75/diviser),(50/diviser));

		autogun_button = new Rectangle((808/diviser),(15/diviser),(100/diviser),(100/diviser));
		freezer_button = new Rectangle((808/diviser),(130/diviser),(100/diviser),(100/diviser));
		tesla_button = new Rectangle((808/diviser),(245/diviser),(100/diviser),(100/diviser));

		rocket_button = new Rectangle((918/diviser),(15/diviser),(100/diviser),(100/diviser));
		laser_button = new Rectangle((918/diviser),(130/diviser),(100/diviser),(100/diviser));
		burner_button = new Rectangle((918/diviser),(245/diviser),(100/diviser),(100/diviser));


		nuker_button = new Rectangle((808/diviser),(360/diviser),(100/diviser),(100/diviser));
		radar_button = new Rectangle((918/diviser),(360/diviser),(100/diviser),(100/diviser));
		vortex_button = new Rectangle((808/diviser),(475/diviser),(100/diviser),(100/diviser));
		bank_button = new Rectangle((918/diviser),(475/diviser),(100/diviser),(100/diviser));

		damage_button = new Rectangle((813/diviser),(15/diviser),(200/diviser),(100/diviser));
		range_button = new Rectangle((813/diviser),(130/diviser),(200/diviser),(100/diviser));
		rate_button = new Rectangle((813/diviser),(245/diviser),(200/diviser),(100/diviser));
		sell_button = new Rectangle((813/diviser),(360/diviser),(200/diviser),(100/diviser));

		Timer gameLoop = new Timer(33, new ActionListener() {
			public void actionPerformed(ActionEvent e) {
				play();
				repaint();
			}
		});
		gameLoop.start();
		//startScreen(gBuffer);
	}

	/////////////////////////////////////////////////////////////////////////
	//////////////////////////play game function//////////////////////////////
	////////////////////////////////////////////////////////////////////////////////

	public void play()
	{
		if(!pause)
		{
			if(start)
				newRound();

			medigun();
			offense();
			setBoost();
			defense();
			blackhole();

			if(enemies == 0 && wave == 0)
			{
				start = true;
				pause = true;
				gold += (int)((double)(gold * intrest)/10);	//interest
			}
			if(lives <= 0)
			{
				lose = true;
			}
		}
		System.out.println("Playing");
		//preserving this highschool jank to remind me how terrible some of my code was
		//for(long delay=0; delay < 100000000; delay ++){} 
		//repaint();
	}

	/////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////paint////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////

	public void paint(Graphics g)
	{
		path(gBuffer);

		drawCreeps(gBuffer);
		drawTowers(gBuffer);

		drawVortex(gBuffer);

		scoreboard(gBuffer);
		menu(gBuffer);

		System.out.println("----painting");
		g.drawImage(virtualMem,0,0,this);

		if(lose)
			gameOverScreen(gBuffer);
	}/* */
	/*public void paint(Graphics g)
	{
		path(g);

		drawCreeps(g);
		drawTowers(g);

		drawVortex(g);

		scoreboard(g);
		menu(g);

		g.drawImage(virtualMem,0,0,this);

		if(lose)
			gameOverScreen(g);
	}/* */

	////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////game calculations and stuff///////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////

	public void newRound()
	{
		start = false;
		level ++;

		for(int count=0; count < maxTowers; count ++)
		{
			tower[count].resetReload();
		}

		Random randy = new Random();

		points = level*5;
		wave = 0;

		while(points > 0)
		{

			switch(randy.nextInt(10))
			{
				case 0:
						if(points >= 3)
						{
							points -= 3;
							type[wave] = 0;
							wave ++;
						}
					break;

				case 1:
						if(points >= 6)
						{
							points -= 6;
							type[wave] = 1;
							wave ++;
						}
					break;

				case 2:
						if(points >= 6)
						{
							points -= 6;
							type[wave] = 2;
							wave ++;
						}
					break;

				case 3:
						if(points >= 1)
						{
							points -= 1;
							type[wave] = 3;
							wave ++;
						}
					break;

				case 4:
						if(points >= 35)
						{
							points -= 35;
							type[wave] = 4;
							wave ++;
						}
					break;

				case 5:
						if(points >= 15)
						{
							points -= 15;
							type[wave] = 5;
							wave ++;
						}
					break;

				case 6:
						if(points >= 15)
						{
							points -= 15;
							type[wave] = 6;
							wave ++;
						}
					break;

				case 7:
						if(points >= 15)
						{
							points -= 15;
							type[wave] = 7;
							wave ++;
						}
					break;

				case 8:
						if(points >= 15)
						{
							points -= 15;
							type[wave] = 8;
							wave ++;
						}
					break;

				case 9:
						if(points >= 15)
						{
							points -= 15;
							type[wave] = 9;
							wave ++;
						}
					break;

				case 10:
						if(points >= 21)
						{
							points -= 21;
							type[wave] = 10;
							wave ++;
						}
					break;

				case 11:
						if(points >= 6)
						{
							points -= 6;
							type[wave] = 11;
							wave ++;
						}
					break;

				case 12:
						if(points >= 35)
						{
							points -= 35;
							type[wave] = 12;
							wave ++;
						}
					break;

				case 13:
						if(points >= 35)
						{
							points -= 35;
							type[wave] = 13;
							wave ++;
						}
					break;

				default:
					break;
			}

		}
	}

	public void offense()
	{
		while(enemies < 25 && wave > 0 && wait == 0)
		{
			newCreep();
			wait += 15;
		}

		if(wait > 0)
			wait --;

		int[] checkpointX = {(175/diviser),(175/diviser),(75/diviser),(75/diviser),(275/diviser),(275/diviser),(75/diviser),(75/diviser),(400/diviser),(400/diviser),(725/diviser),(725/diviser),(525/diviser),(525/diviser),(725/diviser),(725/diviser),(625/diviser),(625/diviser),(775/diviser),(775/diviser)};
		int[] checkpointY = {(350/diviser),(175/diviser),(175/diviser),(75/diviser),(75/diviser),(475/diviser),(475/diviser),(625/diviser),(625/diviser),(75/diviser),(75/diviser),(225/diviser),(225/diviser),(625/diviser),(625/diviser),(525/diviser),(525/diviser),(350/diviser),(350/diviser),(350/diviser)};


		for(int count=0; count < enemies; count ++)
		{
			if(creep[count].getH() <= 0 && creep[count].getA() <= 0)
				death(count);

			creep[count].run(checkpointX[creep[count].getC()],checkpointY[creep[count].getC()]);
		}

	}

	public void newCreep()
	{
		switch (type[wave-1])
		{
			case 0:
					creep[enemies] = new Creep(25/diviser,350/diviser,(4*level),4,diviser);
					enemies ++;
					wave --;
				break;

			case 1:
					creep[enemies] = new Fast_creep(25/diviser,350/diviser,(2*level),6,diviser);
					enemies ++;
					wave --;
				break;

			case 2:
					creep[enemies] = new Tough_creep(25/diviser,350/diviser,(6*level),2,diviser);
					enemies ++;
					wave --;
				break;

			case 3:
					creep[enemies] = new Swarm_creep(25/diviser,350/diviser,(3*level),5,diviser);
					enemies ++;
					wave --;
				break;

			case 4:
					creep[enemies] = new Boss_creep(25/diviser,350/diviser,(7*level),3,diviser);
					enemies ++;
					wave --;
				break;

			case 5:

					creep[enemies] = new Ninja_creep(25/diviser,350/diviser,(3*level),5,diviser);
					enemies ++;
					wave --;
				break;

			case 6:
					creep[enemies] = new Boomer_creep(25/diviser,350/diviser,(4*level),5,diviser);
					enemies ++;
					wave --;
				break;

			case 7:
					creep[enemies] = new Medic_creep(25/diviser,350/diviser,(3*level),4,diviser);
					enemies ++;
					wave --;
				break;

			case 8:
					creep[enemies] = new Jet_creep(25/diviser,350/diviser,(2*level),3,diviser);
					enemies ++;
					wave --;
				break;

			case 9:
					creep[enemies] = new Tank_creep(25/diviser,350/diviser,(3*level),3,diviser);
					enemies ++;
					wave --;
				break;

			/*case 10:
					creep[enemies] = new Stealth_creep(25/diviser,350/diviser,(4*level),2,diviser);
					enemies ++;
					wave --;
				break;

			case 11:
					creep[enemies] = new Bees_creep(25/diviser,350/diviser,(2*level),5,diviser);
					enemies ++;
					wave --;
				break;

			case 12:
					creep[enemies] = new Queen_creep(25/diviser,350/diviser,(6*level),1,diviser);
					enemies ++;
					wave --;
				break;

			case 13:
					creep[enemies] = new Carrier_creep(25/diviser,350/diviser,(6*level),2,diviser);
					enemies ++;
					wave --;
				break;

			case 14:
					creep[enemies] = new Smuggler_creep(25/diviser,350/diviser,(6*level),2,diviser);
					enemies ++;
					wave --
				break;*/

			default:
				break;

		}
	}

	public void death(int index)
	{
		if(creep[index] instanceof Fast_creep && creep[index].getG() == false)
		{
			gold += level*6;
		}
		else if(creep[index] instanceof Tough_creep && creep[index].getG() == false)
		{
			gold += level*6;
		}
		else if(creep[index] instanceof Swarm_creep && creep[index].getG() == false)
		{
			gold += level*1;
		}
		else if(creep[index] instanceof Boss_creep && creep[index].getG() == false)
		{
			gold += level*35;
		}
		else if(creep[index] instanceof Ninja_creep && creep[index].getG() == false)
		{
			gold += level*15;
		}
		else if(creep[index] instanceof Boomer_creep && creep[index].getG() == false)
		{
			for(int count=0; count < enemies; count ++)
			{
				double a = creep[count].getX()-creep[index].getX();
				double b = creep[count].getY()-creep[index].getY();
				double c = Math.hypot(a,b);

				if(c <= 100/diviser)
				{
					creep[count].takeDamage(creep[index].getM());
				}
			}
			gold += level*15;
		}
		else if(creep[index] instanceof Medic_creep && creep[index].getG() == false)
		{
			gold += level*15;
		}
		else if(creep[index] instanceof Jet_creep && creep[index].getG() == false)
		{
			gold += level*15;
		}
		else if(creep[index] instanceof Tank_creep && creep[index].getG() == false)
		{
			creep[enemies] = new Creep(creep[index].getX()+(10/diviser),creep[index].getY(),(4*level),4,creep[index].getC(),diviser);
			enemies ++;
			creep[enemies] = new Creep(creep[index].getX()-(10/diviser),creep[index].getY(),(4*level),4,creep[index].getC(),diviser);
			enemies ++;
			creep[enemies] = new Creep(creep[index].getX(),creep[index].getY()+(10/diviser),(4*level),4,creep[index].getC(),diviser);
			enemies ++;
			creep[enemies] = new Creep(creep[index].getX(),creep[index].getY()-(10/diviser),(4*level),4,creep[index].getC(),diviser);
			enemies ++;

			gold += level*15;
		}
		else if(creep[index] instanceof Creep && creep[index].getG() == false)
		{
			gold += level*3;
		}

		if(creep[index].getG() == true)
			lives --;

		for(int count = index; count < enemies-1; count ++)
		{
			if(creep[count+1] instanceof Fast_creep)
				creep[count] = new Fast_creep(creep[count+1], diviser);
			else if(creep[count+1] instanceof Tough_creep)
				creep[count] = new Tough_creep(creep[count+1], diviser);
			else if(creep[count+1] instanceof Swarm_creep)
				creep[count] = new Swarm_creep(creep[count+1], diviser);
			else if(creep[count+1] instanceof Boss_creep)
				creep[count] = new Boss_creep(creep[count+1], diviser);
			else if(creep[count+1] instanceof Ninja_creep)
				creep[count] = new Ninja_creep(creep[count+1], diviser);
			else if(creep[count+1] instanceof Boomer_creep)
				creep[count] = new Boomer_creep(creep[count+1], diviser);
			else if(creep[count+1] instanceof Medic_creep)
				creep[count] = new Medic_creep(creep[count+1], diviser);
			else if(creep[count+1] instanceof Jet_creep)
				creep[count] = new Jet_creep(creep[count+1], diviser);
			else if(creep[count+1] instanceof Tank_creep)
				creep[count] = new Tank_creep(creep[count+1], diviser);
			else if(creep[count+1] instanceof Creep)
				creep[count] = new Creep(creep[count+1], diviser);
		}

		enemies --;
	}

	public void defense()
	{
		for(int count=0; count < maxTowers; count ++)
		{
			tower[count].Attack(creep, enemies);
		}
	}

	public void medigun()
	{
		for(int count=0; count < enemies; count ++)
		{
			if(creep[count] instanceof Medic_creep)
			{
				if(creep[count].getA()==0)
					for(int count2=0; count2 < enemies; count2 ++)
					{
						double a = creep[count2].getX()-creep[count].getX();
						double b = creep[count2].getY()-creep[count].getY();
						double c = Math.hypot(a,b);

						if(c <= 100/diviser && creep[count2].getH() < creep[count2].getM())
						{
							creep[count2].shock(-10);
						}
					}
			}
		}
	}

	public void setBoost()
	{
		int d=0, r=0, t=0;

		for(int count=0; count < maxTowers; count ++)
		{
			if(!(tower[count] instanceof Radar_tower))
			{
				for(int count2=0; count2 < maxTowers; count2 ++)
				{
					if(tower[count2] instanceof Radar_tower)
					{
						double a = tower[count2].getX()-tower[count].getX();
					    double b = tower[count2].getY()-tower[count].getY();
					    double c = Math.hypot(a,b);

					    if(c <= 100/diviser)
					    {
					    	if(tower[count2].getDamage() > d)
					    		d = tower[count2].getDamage()-1;

					    	if(tower[count2].getRange() > r)
					    		r = tower[count2].getRange()-1;

					    	if(tower[count2].getRate() > t)
					    		t = tower[count2].getRate()-1;
					    }
					}
				}
				tower[count].setBoostedD(d);
				tower[count].setBoostedR(r);
				tower[count].setBoostedT(t);
			}
		}

		for(int count=0; count < maxTowers; count ++)
		{
			if(tower[count] instanceof Radar_tower)
			{
				for(int count2=0; count2 < enemies; count2 ++)
				{
					double a = creep[count2].getX()-tower[count].getX();
					double b = creep[count2].getY()-tower[count].getY();
					double c = Math.hypot(a,b);

					if(c <= 100/diviser)
					{
						creep[count2].setV();
					}
				}
			}
		}
	}

	public void blackhole()
	{
		for(int count=0; count < maxVortex; count ++)
		{
			for(int count2=0; count2 < enemies; count2 ++)
			{
				if(portal[count].inside(creep[count2].getX(),creep[count2].getY()))
				{
					creep[count2].warpX(25/diviser);
					creep[count2].warpY(350/diviser);
					creep[count2].setC();
				}
			}

			if(vortex[count].getA() <= 0)
			{
				for(int count2=count; count2 < maxVortex-1; count2 ++)
				{
					vortex[count] = new Vortex(vortex[count+1],diviser);
				}
				maxVortex --;
			}
		}
	}

	public void sellTower()
	{
		gold += tower[choice].getUpS();

		for(int count = choice; count < maxTowers-1; count ++)
		{
			building[count] = new Rectangle(tower[count+1].getX()-(20/diviser), tower[count+1].getY()-(20/diviser),(40/diviser),(40/diviser));

			if(tower[count+1] instanceof Autogun_tower)
			{
				tower[count] = new Autogun_tower(tower[count+1],diviser);
			}
			else if(tower[count+1] instanceof Rocket_tower)
			{
				tower[count] = new Rocket_tower((Rocket_tower)tower[count+1],diviser);
			}
			else if(tower[count+1] instanceof Freezer_tower)
			{
				tower[count] = new Freezer_tower(tower[count+1],diviser);
			}
			else if(tower[count+1] instanceof Laser_tower)
			{
				tower[count] = new Laser_tower(tower[count+1],diviser);
			}
			else if(tower[count+1] instanceof Tesla_tower)
			{
				tower[count] = new Tesla_tower(tower[count+1],diviser);
			}
			else if(tower[count+1] instanceof Burner_tower)
			{
				tower[count] = new Burner_tower(tower[count+1],diviser);
			}
			else if(tower[count+1] instanceof Nuker_tower)
			{
				tower[count] = new Nuker_tower(tower[count+1],diviser);
			}
			else if(tower[count+1] instanceof Radar_tower)
			{
				tower[count] = new Radar_tower(tower[count+1],diviser);
			}


		}
		maxTowers --;
	}

	////////////////////////////////////////////////////////////////////////////
	/////////////////////////draw things///////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////

	public void drawTowers(Graphics g)
	{
		//draws bases
		for(int index=0; index < maxTowers; index ++)
		{
			for(int count = 0; count < 10; count ++)
		    {
		     	if(tower[index] instanceof Autogun_tower)
		     		gBuffer.setColor(new Color(0, 225-(count*10), 0));
		     	else if(tower[index] instanceof Rocket_tower)
		     		gBuffer.setColor(new Color(255-(count*10), 0, 0));
		     	else if(tower[index] instanceof Freezer_tower)
		     		gBuffer.setColor(new Color(0, 255-(count*10), 255-(count*10)));
		     	else if(tower[index] instanceof Laser_tower)
		     		gBuffer.setColor(new Color(255-(count*10), 0, 255-(count*10)));
		     	else if(tower[index] instanceof Tesla_tower)
		     		gBuffer.setColor(new Color(255-(count*10), 255-(count*10), 0));
		     	else if(tower[index] instanceof Burner_tower)
		     		gBuffer.setColor(new Color(255-(count*10), 125-(count*5), 0));
		     	else if(tower[index] instanceof Nuker_tower)
		     		gBuffer.setColor(new Color(0, 0, 255-(count*10)));
		     	else
		     		gBuffer.setColor(new Color(255-(count*10), 255-(count*10), 255-(count*10)));

		       	gBuffer.drawRect(tower[index].getX()-((20-count)/diviser),tower[index].getY()-((20-count)/diviser),((40-count*2)/diviser),((40-count*2)/diviser));
		    }

		    if(choice == index)
		    {
		    	gBuffer.drawOval(tower[index].getX()-(tower[index].getRange(0)/2)/diviser, tower[index].getY()-(tower[index].getRange(0)/2)/diviser, tower[index].getRange(0)/diviser,tower[index].getRange(0)/diviser);
		    }

		    gBuffer.setColor(Color.white);
		    gBuffer.drawRect(tower[index].getX()-(20/diviser),tower[index].getY()-(20/diviser),(40/diviser),(40/diviser));
		}

		//draws towers
		for(int count=0; count < maxTowers; count ++)
		{
			tower[count].drawTower(gBuffer);
		}
	}

	public void drawCreeps(Graphics g)
	{
		for(int count=0; count < enemies; count ++)
		{
			creep[count].drawCreep(gBuffer);
		}
	}

	public void drawVortex(Graphics g)
	{
		for(int count=0; count < maxVortex; count ++)
		{
			vortex[count].drawVortex(gBuffer);
		}
	}

	//////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////mouse controls//////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////

	public boolean mouseDown(Event e, int x, int y)
	{
		boolean flag = false;

		xCoord = x;
		yCoord = y;

		/*if(lose)										//game over
		{
		}
		else if(first)
		{
			if(play_button.inside(x,y))			//start screen
			{
				first = false;
			}
		}
		else */
		if(x > (800/diviser) && !upgrade)						//game
			if(start_button.inside(x,y))
			{
				button = 1;
				pause = !pause;
			}
			else if(autogun_button.inside(x,y) && gold >= 125)
			{
				button = 2;
			}
			else if(rocket_button.inside(x,y) && gold >= 375)
			{
				button = 3;
			}
			else if(freezer_button.inside(x,y) && gold >= 250)
			{
				button = 4;
			}
			else if(laser_button.inside(x,y) && gold >= 500)
			{
				button = 5;
			}
			else if(tesla_button.inside(x,y) && gold >= 750)
			{
				button = 6;
			}
			else if(burner_button.inside(x,y) && gold >= 625)
			{
				button = 7;
			}
			else if(nuker_button.inside(x,y) && gold >= 875)
			{
				button = 8;
			}
			else if(radar_button.inside(x,y) && gold >= 125)
			{
				button = 9;
			}
			else if(vortex_button.inside(x,y) && gold >= 500)
			{
				button = 10;
			}
			else if(bank_button.inside(x,y) && gold >= 100*intrest && button != 11)
			{
				button = 11;
			}
			else if(bank_button.inside(x,y) && gold >= 100*intrest && button == 11)
			{
				gold -= 100*intrest;
				intrest += 1;
				button = 0;
			}
			else
			{
				button = 0;
			}
		else if(upgrade)
		{
			if(start_button.inside(x,y))
			{
				button = 1;
				pause = !pause;
			}
			else if(damage_button.inside(x,y) && gold >= tower[choice].getUpD() && tower[choice].getUpD() != 0 && button != 12)
			{
				button = 12;
			}
			else if(damage_button.inside(x,y) && gold >= tower[choice].getUpD() && button == 12)
			{
				gold -= tower[choice].getUpD();
				tower[choice].upgradeDamage();
				button = 0;
			}
			else if(range_button.inside(x,y) && gold >= tower[choice].getUpR() && tower[choice].getUpR() != 0 && button != 13)
			{
				button = 13;
			}
			else if(range_button.inside(x,y) && gold >= tower[choice].getUpR() && button == 13)
			{
				gold -= tower[choice].getUpR();
				tower[choice].upgradeRange();
				button = 0;
			}
			else if(rate_button.inside(x,y) && gold >= tower[choice].getUpT() && tower[choice].getUpT() != 0 && button != 14)
			{
				button = 14;
			}
			else if(rate_button.inside(x,y) && gold >= tower[choice].getUpT() && button == 14)
			{
				gold -= tower[choice].getUpT();
				tower[choice].upgradeRate();
				button = 0;
			}
			else if(sell_button.inside(x,y) && button != 15)
			{
				button = 15;
			}
			else if(sell_button.inside(x,y) && button == 15)
			{
				sellTower();
				upgrade = false;
				button = 0;
			}
			else if(x > (800/diviser))
			{
			}
			else
			{
				upgrade = false;
				choice = -1;
				button = 0;
			}
		}
		else
		{
			if(button <= 1)
			{
				for(int count=0; count < maxTowers; count ++)
				{
					if(building[count].inside(x,y))
					{
						upgrade = true;
						choice = count;
					}
				}
			}
			else if(button > 1 && button < 10)
			{
				for(int count=0; count < maxTowers; count ++)
				{
					if(building[count].inside(x,y))
					{
						button = 0;
						flag = true;
					}
				}

				if(path.inside(x,y))
				{
					button = 0;
					flag = true;
				}

				if(!flag)
				{
					switch(button)
					{
						case 2:
								tower[maxTowers] = new Autogun_tower(xCoord,yCoord,diviser);
								building[maxTowers] = new Rectangle(x-(20/diviser),y-(20/diviser),(40/diviser),(40/diviser));
								maxTowers ++;
								gold -= 125;
								button = 0;
							break;

						case 3:
								tower[maxTowers] = new Rocket_tower(xCoord,yCoord,diviser);
								building[maxTowers] = new Rectangle(x-(20/diviser),y-(20/diviser),(40/diviser),(40/diviser));
								maxTowers ++;
								gold -= 375;
								button = 0;
							break;

						case 4:
								tower[maxTowers] = new Freezer_tower(xCoord,yCoord,diviser);
								building[maxTowers] = new Rectangle(x-(20/diviser),y-(20/diviser),(40/diviser),(40/diviser));
								maxTowers ++;
								gold -= 250;
								button = 0;
							break;

						case 5:
								tower[maxTowers] = new Laser_tower(xCoord,yCoord,diviser);
								building[maxTowers] = new Rectangle(x-(20/diviser),y-(20/diviser),(40/diviser),(40/diviser));
								maxTowers ++;
								gold -= 500;
								button = 0;
							break;

						case 6:
								tower[maxTowers] = new Tesla_tower(xCoord,yCoord,diviser);
								building[maxTowers] = new Rectangle(x-(20/diviser),y-(20/diviser),(40/diviser),(40/diviser));
								maxTowers ++;
								gold -= 750;
								button = 0;
							break;

						case 7:
								tower[maxTowers] = new Burner_tower(xCoord,yCoord,diviser);
								building[maxTowers] = new Rectangle(x-(20/diviser),y-(20/diviser),(40/diviser),(40/diviser));
								maxTowers ++;
								gold -= 625;
								button = 0;
							break;

						case 8:
								tower[maxTowers] = new Nuker_tower(xCoord,yCoord,diviser);
								building[maxTowers] = new Rectangle(x-(20/diviser),y-(20/diviser),(40/diviser),(40/diviser));
								maxTowers ++;
								gold -= 875;
								button = 0;
							break;

						case 9:
								tower[maxTowers] = new Radar_tower(xCoord,yCoord,diviser);
								building[maxTowers] = new Rectangle(x-(20/diviser),y-(20/diviser),(40/diviser),(40/diviser));
								maxTowers ++;
								gold -= 125;
								button = 0;
							break;

						default:
							break;
					}
				}
			}
			else if(button == 10)
			{
				for(int count=0; count < maxTowers; count ++)
				{
					if(building[count].inside(x,y))
					{
						button = 0;
						flag = true;
					}
				}

				if(!flag)
				{
					vortex[maxVortex] = new Vortex(xCoord,yCoord,diviser);
					portal[maxVortex] = new Rectangle(x-(40/diviser),y-(40/diviser),(80/diviser),(80/diviser));
					maxVortex ++;
					gold -= 500;
					button = 0;
				}
			}
		}

		repaint();
		return true;
	}

	//////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////Draw the game board/////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////

	public void path(Graphics g)
	{
		gBuffer.setColor(Color.darkGray);
		gBuffer.fillRect(0,0,appletWidth,appletHeight);

		gBuffer.setColor(Color.blue);
		gBuffer.fillPolygon(path);
		gBuffer.setColor(Color.black);
		gBuffer.drawPolygon(path);
	}

	public void scoreboard(Graphics g)
	{
		///////////////////////////The beginning///////////////////////////
		gBuffer.setColor(Color.red);
        gBuffer.fillRect((0/diviser),(300/diviser),(50/diviser),(100/diviser));
		///////////////////////////The end////////////////////////////////
        gBuffer.setColor(Color.green);
        gBuffer.fillRect((750/diviser),(300/diviser),(50/diviser),(100/diviser));

        gBuffer.setColor(Color.white);
       	gBuffer.drawRect((0/diviser),(300/diviser),(50/diviser),(100/diviser));
        gBuffer.drawRect((750/diviser),(300/diviser),(50/diviser),(100/diviser));


		//////////////////////////The menu box/////////////////////////////
		gBuffer.setColor(Color.gray);
        gBuffer.fillRect((800/diviser),(0/diviser),(224/diviser),(700/diviser));
        gBuffer.setColor(Color.black);
        ///////////////////////////The different buttons////////////////////
		if(!upgrade)
		{
			if(button == 2)
			{
				gBuffer.setColor(Color.lightGray);
				gBuffer.fillRect((808/diviser),(15/diviser),(100/diviser),(100/diviser));
				gBuffer.setColor(Color.black);
			}
			gBuffer.drawRect((808/diviser),(15/diviser),(100/diviser),(100/diviser));

			if(button == 3)
			{
				gBuffer.setColor(Color.lightGray);
				gBuffer.fillRect((918/diviser),(15/diviser),(100/diviser),(100/diviser));
				gBuffer.setColor(Color.black);
			}
			gBuffer.drawRect((918/diviser),(15/diviser),(100/diviser),(100/diviser));

			if(button == 4)
			{
				gBuffer.setColor(Color.lightGray);
				gBuffer.fillRect((808/diviser),(130/diviser),(100/diviser),(100/diviser));
				gBuffer.setColor(Color.black);
			}
			gBuffer.drawRect((808/diviser),(130/diviser),(100/diviser),(100/diviser));

			if(button == 5)
			{
				gBuffer.setColor(Color.lightGray);
				gBuffer.fillRect((918/diviser),(130/diviser),(100/diviser),(100/diviser));
				gBuffer.setColor(Color.black);
			}
			gBuffer.drawRect((918/diviser),(130/diviser),(100/diviser),(100/diviser));

			if(button == 6)
			{
				gBuffer.setColor(Color.lightGray);
				gBuffer.fillRect((808/diviser),(245/diviser),(100/diviser),(100/diviser));
				gBuffer.setColor(Color.black);
			}
			gBuffer.drawRect((808/diviser),(245/diviser),(100/diviser),(100/diviser));

			if(button == 7)
			{
				gBuffer.setColor(Color.lightGray);
				gBuffer.fillRect((918/diviser),(245/diviser),(100/diviser),(100/diviser));
				gBuffer.setColor(Color.black);
			}
			gBuffer.drawRect((918/diviser),(245/diviser),(100/diviser),(100/diviser));


			if(button == 8)
			{
				gBuffer.setColor(Color.lightGray);
				gBuffer.fillRect((808/diviser),(360/diviser),(100/diviser),(100/diviser));
				gBuffer.setColor(Color.black);
			}
			gBuffer.drawRect((808/diviser),(360/diviser),(100/diviser),(100/diviser));

	        if(button == 9)
			{
				gBuffer.setColor(Color.lightGray);
				gBuffer.fillRect((918/diviser),(360/diviser),(100/diviser),(100/diviser));
				gBuffer.setColor(Color.black);
			}
			gBuffer.drawRect((918/diviser),(360/diviser),(100/diviser),(100/diviser));

			if(button == 10)
			{
				gBuffer.setColor(Color.lightGray);
				gBuffer.fillRect((808/diviser),(475/diviser),(100/diviser),(100/diviser));
				gBuffer.setColor(Color.black);
			}
			gBuffer.drawRect((808/diviser),(475/diviser),(100/diviser),(100/diviser));

			if(button == 11)
			{
				gBuffer.setColor(Color.lightGray);
				gBuffer.fillRect((918/diviser),(475/diviser),(100/diviser),(100/diviser));
				gBuffer.setColor(Color.black);
			}
			gBuffer.drawRect((918/diviser),(475/diviser),(100/diviser),(100/diviser));
		}
		else
		{
			if(button == 12)
			{
				gBuffer.setColor(Color.lightGray);
				gBuffer.fillRect((813/diviser),(15/diviser),(200/diviser),(100/diviser));
				gBuffer.setColor(Color.black);
			}
			gBuffer.drawRect((813/diviser),(15/diviser),(200/diviser),(100/diviser));

			if(button == 13)
			{
				gBuffer.setColor(Color.lightGray);
				gBuffer.fillRect((813/diviser),(130/diviser),(200/diviser),(100/diviser));
				gBuffer.setColor(Color.black);
			}
			gBuffer.drawRect((813/diviser),(130/diviser),(200/diviser),(100/diviser));

			if(button == 14)
			{
				gBuffer.setColor(Color.lightGray);
				gBuffer.fillRect((813/diviser),(245/diviser),(200/diviser),(100/diviser));
				gBuffer.setColor(Color.black);
			}
			gBuffer.drawRect((813/diviser),(245/diviser),(200/diviser),(100/diviser));

			if(button == 15)
			{
				gBuffer.setColor(Color.lightGray);
				gBuffer.fillRect((813/diviser),(360/diviser),(200/diviser),(100/diviser));
				gBuffer.setColor(Color.black);
			}
			gBuffer.drawRect((813/diviser),(360/diviser),(200/diviser),(100/diviser));
		}


		gBuffer.setColor(Color.lightGray);
		gBuffer.fillRect((945/diviser),(625/diviser),(75/diviser),(50/diviser));
		gBuffer.setColor(Color.black);
		gBuffer.drawRect((945/diviser),(625/diviser),(75/diviser),(50/diviser));


		gBuffer.setColor(Color.black);

		Polygon greenLight = new Polygon();
		greenLight.addPoint((965/diviser),(665/diviser));
		greenLight.addPoint((965/diviser),(635/diviser));
		greenLight.addPoint((995/diviser),(650/diviser));
		greenLight.addPoint((965/diviser),(665/diviser));

		if(pause)
        	gBuffer.drawPolygon(greenLight);
        else
        {
        	gBuffer.drawRect((965/diviser),(635/diviser),(15/diviser),(30/diviser));
        	gBuffer.drawRect((985/diviser),(635/diviser),(15/diviser),(30/diviser));
        }

		///////////////////////The scoreboard////////////////////////
        gBuffer.setFont(new Font("Courier", Font.BOLD, (22/diviser)));
        gBuffer.drawString("Gold:"+gold,(810/diviser),(640/diviser));
        gBuffer.drawString("Lives:"+lives,(810/diviser),(665/diviser));
        gBuffer.drawString("Level:"+level,(810/diviser),(690/diviser));
	}

	public void menu(Graphics g)
	{
		gBuffer.setFont(new Font("Arial", Font.BOLD, (21/diviser)));

		if(!upgrade)
		{
	        gBuffer.drawString("Autogun",(820/diviser),(40/diviser));
	        gBuffer.drawString("Freezer",(820/diviser),(155/diviser));
	        gBuffer.drawString("Tesla",(820/diviser),(270/diviser));
			gBuffer.drawString("Rocket",(935/diviser),(40/diviser));
	        gBuffer.drawString("Laser",(935/diviser),(155/diviser));
	        gBuffer.drawString("Burner",(935/diviser),(270/diviser));
			gBuffer.drawString("Nuker",(825/diviser),(385/diviser));
			gBuffer.drawString("Radar",(925/diviser),(385/diviser));

			gBuffer.drawString("Vortex",(825/diviser),(500/diviser));
			gBuffer.drawString("Bank: "+intrest+"%",(920/diviser),(500/diviser));


	        gBuffer.drawString("$125",(825/diviser),(65/diviser));
	        gBuffer.drawString("$250",(825/diviser),(180/diviser));
	        gBuffer.drawString("$750",(825/diviser),(295/diviser));
			gBuffer.drawString("$375",(935/diviser),(65/diviser));
	        gBuffer.drawString("$500",(935/diviser),(180/diviser));
	        gBuffer.drawString("$625",(935/diviser),(295/diviser));
	        gBuffer.drawString("$875",(825/diviser),(410/diviser));
	        gBuffer.drawString("$125",(935/diviser),(410/diviser));

	        gBuffer.drawString("$500",(825/diviser),(525/diviser));
	        gBuffer.drawString("$"+(100*intrest),(935/diviser),(525/diviser));


	        gBuffer.setColor(Color.green);
	        gBuffer.fillRect((845/diviser),(75/diviser),(25/diviser),(25/diviser));
	        gBuffer.setColor(Color.cyan);
	        gBuffer.fillRect((845/diviser),(190/diviser),(25/diviser),(25/diviser));
	        gBuffer.setColor(Color.yellow);
	        gBuffer.fillRect((845/diviser),(305/diviser),(25/diviser),(25/diviser));
	        gBuffer.setColor(Color.red);
	        gBuffer.fillRect((955/diviser),(75/diviser),(25/diviser),(25/diviser));
	        gBuffer.setColor(Color.magenta);
	        gBuffer.fillRect((955/diviser),(190/diviser),(25/diviser),(25/diviser));
	        gBuffer.setColor(Color.orange);
	        gBuffer.fillRect((955/diviser),(305/diviser),(25/diviser),(25/diviser));
	        gBuffer.setColor(Color.blue);
	        gBuffer.fillRect((845/diviser),(420/diviser),(25/diviser),(25/diviser));
	        gBuffer.setColor(Color.white);
	        gBuffer.fillRect((955/diviser),(420/diviser),(25/diviser),(25/diviser));

	        gBuffer.setColor(Color.black);
	        gBuffer.fillOval((845/diviser),(535/diviser),(25/diviser),(25/diviser));
	        gBuffer.setColor(Color.white);
	        gBuffer.fillOval((955/diviser),(535/diviser),(25/diviser),(25/diviser));

	        gBuffer.setColor(Color.darkGray);
	        gBuffer.drawRect((845/diviser),(75/diviser),(25/diviser),(25/diviser));
	        gBuffer.drawRect((845/diviser),(190/diviser),(25/diviser),(25/diviser));
	        gBuffer.drawRect((845/diviser),(305/diviser),(25/diviser),(25/diviser));
	        gBuffer.drawRect((955/diviser),(75/diviser),(25/diviser),(25/diviser));
	        gBuffer.drawRect((955/diviser),(190/diviser),(25/diviser),(25/diviser));
	        gBuffer.drawRect((955/diviser),(305/diviser),(25/diviser),(25/diviser));
	        gBuffer.drawRect((845/diviser),(420/diviser),(25/diviser),(25/diviser));
	        gBuffer.drawRect((955/diviser),(420/diviser),(25/diviser),(25/diviser));

	        gBuffer.drawOval((845/diviser),(535/diviser),(25/diviser),(25/diviser));
	        gBuffer.drawOval((955/diviser),(535/diviser),(25/diviser),(25/diviser));
		}
		else
		{
			gBuffer.drawString("Damage",(850/diviser),(40/diviser));
	        gBuffer.drawString("Range",(850/diviser),(155/diviser));
	        gBuffer.drawString("Rate",(850/diviser),(270/diviser));
			gBuffer.drawString("Sell",(850/diviser),(385/diviser));

			gBuffer.drawString("$" + tower[choice].getUpD(),(860/diviser),(65/diviser));
	        gBuffer.drawString("$" + tower[choice].getUpR(),(860/diviser),(180/diviser));
	        gBuffer.drawString("$" + tower[choice].getUpT(),(860/diviser),(295/diviser));
	        gBuffer.drawString("$" + tower[choice].getUpS(),(860/diviser),(410/diviser));

	        gBuffer.setColor(Color.red);
	        gBuffer.fillRect((835/diviser),(75/diviser),((25*tower[choice].getDamage())/diviser),(25/diviser));
	        gBuffer.setColor(Color.blue);
	        gBuffer.fillRect((835/diviser),(190/diviser),((25*tower[choice].getRange())/diviser),(25/diviser));
	        gBuffer.setColor(Color.green);
	        gBuffer.fillRect((835/diviser),(305/diviser),((25*tower[choice].getRate())/diviser),(25/diviser));

	        gBuffer.setColor(Color.black);
	        gBuffer.drawRect((835/diviser),(75/diviser),(25/diviser),(25/diviser));
	        gBuffer.drawRect((835/diviser),(190/diviser),(25/diviser),(25/diviser));
	        gBuffer.drawRect((835/diviser),(305/diviser),(25/diviser),(25/diviser));

	        gBuffer.drawRect((860/diviser),(75/diviser),(25/diviser),(25/diviser));
	        gBuffer.drawRect((860/diviser),(190/diviser),(25/diviser),(25/diviser));
	        gBuffer.drawRect((860/diviser),(305/diviser),(25/diviser),(25/diviser));

	        gBuffer.drawRect((885/diviser),(75/diviser),(25/diviser),(25/diviser));
	        gBuffer.drawRect((885/diviser),(190/diviser),(25/diviser),(25/diviser));
	        gBuffer.drawRect((885/diviser),(305/diviser),(25/diviser),(25/diviser));

	        gBuffer.drawRect((910/diviser),(75/diviser),(25/diviser),(25/diviser));
	        gBuffer.drawRect((910/diviser),(190/diviser),(25/diviser),(25/diviser));
	        gBuffer.drawRect((910/diviser),(305/diviser),(25/diviser),(25/diviser));

	        gBuffer.drawRect((935/diviser),(75/diviser),(25/diviser),(25/diviser));
	        gBuffer.drawRect((935/diviser),(190/diviser),(25/diviser),(25/diviser));
	        gBuffer.drawRect((935/diviser),(305/diviser),(25/diviser),(25/diviser));
		}
	}

	///////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////start and game over screens////////////////
	///////////////////////////////////////////////////////////////////////////////////////////

	public void startScreen(Graphics g)
	{
		gBuffer.setColor(Color.black);
		gBuffer.fillRect(0,0,appletWidth,appletHeight);

		gBuffer.setFont(new Font("Arial", Font.BOLD, (50/diviser)));

        gBuffer.drawString("Tower Defense",(200/diviser),(100/diviser));

        gBuffer.setColor(Color.gray);
        gBuffer.fillRect((200/diviser),(600/diviser),(300/diviser),(100/diviser));

        gBuffer.setColor(Color.blue);
        gBuffer.drawRect((200/diviser),(600/diviser),(300/diviser),(100/diviser));

        gBuffer.drawString("Start!",(300/diviser),(650/diviser));

        g.drawImage(virtualMem,0,0,this);

        while(first) {}
	}

	public void gameOverScreen(Graphics g)
	{
		gBuffer.setColor(Color.black);
		gBuffer.fillRect(0,0,appletWidth,appletHeight);

		gBuffer.setFont(new Font("Arial", Font.BOLD, (50/diviser)));

        gBuffer.drawString("GAME OVER YEAH!",(200/diviser),(100/diviser));

        g.drawImage(virtualMem,0,0,this);
	}

	public void update(Graphics g)	{	paint(g);	}

}
